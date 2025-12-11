-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE app_role AS ENUM ('admin_app', 'entrenador_principal', 'staff', 'jugador');
CREATE TYPE club_status AS ENUM ('pendiente', 'aprobado', 'rechazado');
CREATE TYPE match_status AS ENUM ('abierto', 'cerrado', 'finalizado');
CREATE TYPE payment_status AS ENUM ('pagado', 'pendiente', 'anulado');

-- 1. PROFILES
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    rol app_role NOT NULL DEFAULT 'jugador',
    avatar_url TEXT,
    fecha_nacimiento DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLUBS
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    logo_url TEXT,
    ciudad TEXT NOT NULL,
    pais TEXT NOT NULL,
    telefono_contacto TEXT,
    ruc_dni TEXT,
    status club_status DEFAULT 'pendiente',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- The creator (usually Coach)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLUB MEMBERS (Junction table for Profiles <-> Clubs)
CREATE TABLE club_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role_in_club VARCHAR(50) DEFAULT 'member', -- e.g., 'staff', 'coach', 'player'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(club_id, profile_id)
);

-- 4. CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL, -- e.g. "Sub 15", "Juvenil"
    edad_min INT NOT NULL,
    edad_max INT NOT NULL,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE, -- If null, it's a system default category? Or all are club specific? Assuming club specific or mixed. 
    -- Let's assume for now categories can be system-wide (club_id NULL) or custom (club_id NOT NULL).
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TEAMS
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL, -- "Águilas Sub 15 A"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TEAM PLAYERS
CREATE TABLE team_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, profile_id)
);

-- 7. PAYMENTS LEDGER
CREATE TABLE payments_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    player_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    monto DECIMAL(10, 2) NOT NULL,
    fecha_pago DATE DEFAULT CURRENT_DATE,
    concepto TEXT NOT NULL,
    metodo_pago TEXT NOT NULL,
    nro_comprobante TEXT,
    estado payment_status DEFAULT 'pendiente',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Who recorded this
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. MATCHMAKING POSTS
CREATE TABLE matchmaking_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    fecha_partido TIMESTAMPTZ NOT NULL,
    lugar TEXT NOT NULL,
    categoria_requerida TEXT NOT NULL, -- Could link to categories, but free text is flexible for "Sub 15/16"
    nivel TEXT NOT NULL, -- e.g. "Intermedio", "Avanzado"
    estado match_status DEFAULT 'abierto',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MEDICAL RECORDS
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    tipo_sangre VARCHAR(5),
    alergias TEXT,
    lesiones_historial TEXT,
    contacto_emergencia TEXT,
    telefono_emergencia TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- AGE VALIDATION TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION check_player_age_category()
RETURNS TRIGGER AS $$
DECLARE
    player_dob DATE;
    cat_min INT;
    cat_max INT;
    player_age INT;
BEGIN
    -- Get player DOB
    SELECT fecha_nacimiento INTO player_dob FROM profiles WHERE id = NEW.profile_id;
    
    IF player_dob IS NULL THEN
        RAISE EXCEPTION 'El jugador no tiene fecha de nacimiento registrada.';
    END IF;

    -- Calculate age (approximate for year)
    player_age := EXTRACT(YEAR FROM age(CURRENT_DATE, player_dob));

    -- Get category limits from the team
    SELECT c.edad_min, c.edad_max INTO cat_min, cat_max
    FROM teams t
    JOIN categories c ON t.category_id = c.id
    WHERE t.id = NEW.team_id;

    IF cat_min IS NOT NULL AND cat_max IS NOT NULL THEN
        IF player_age < cat_min OR player_age > cat_max THEN
            RAISE EXCEPTION 'La edad del jugador (%) no cumple con el rango de la categoría (% - %)', player_age, cat_min, cat_max;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_player_age
BEFORE INSERT ON team_players
FOR EACH ROW
EXECUTE FUNCTION check_player_age_category();

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- PROFILES: Public read, private write (own)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- CLUBS: Public read
CREATE POLICY "Clubs are viewable by everyone" ON clubs FOR SELECT USING (true);
-- Update: Only creator or members with 'admin' role in club_members? Assuming creator for now.
CREATE POLICY "Creators can update their clubs" ON clubs FOR UPDATE USING (auth.uid() = created_by);

-- MEDICAL RECORDS: STRICT
-- Viewable by: The user themselves OR a staff member of their club.
CREATE POLICY "Users can view own medical records" ON medical_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view active club members medical records" ON medical_records FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM club_members staff_cm
        JOIN club_members target_cm ON staff_cm.club_id = target_cm.club_id
        WHERE staff_cm.profile_id = auth.uid()
        AND staff_cm.role_in_club IN ('entrenador_principal', 'staff')
        AND target_cm.profile_id = medical_records.user_id
    )
);
CREATE POLICY "Users can update own medical records" ON medical_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medical records" ON medical_records FOR INSERT WITH CHECK (auth.uid() = user_id);

-- MATCHMAKING: Public read, Creator write
CREATE POLICY "Matchmaking posts are public" ON matchmaking_posts FOR SELECT USING (true);
CREATE POLICY "Club staff can create posts" ON matchmaking_posts FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM club_members 
        WHERE profile_id = auth.uid() 
        AND club_id = matchmaking_posts.club_id 
        AND role_in_club IN ('entrenador_principal', 'admin_app')
    )
);

-- PAYMENTS: Private (Staff + Player)
CREATE POLICY "Player can view own payments" ON payments_ledger FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Staff can view club payments" ON payments_ledger FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM club_members 
        WHERE profile_id = auth.uid() 
        AND club_id = payments_ledger.club_id 
        AND role_in_club IN ('entrenador_principal', 'staff')
    )
);

-- TEAM PLAYERS:
-- Public view? Or just club members? Let's say public so people can see rosters.
CREATE POLICY "Rosters are public" ON team_players FOR SELECT USING (true);

