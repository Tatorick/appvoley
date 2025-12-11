-- FUNCTION: Handle New User
-- This function runs automatically when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre_completo, rol, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    (NEW.raw_user_meta_data->>'role')::app_role,
    NEW.email -- Assuming you might want email in profiles too, or remove this line if it's not in your schema. 
              -- Wait, my schema logic didn't put email in profiles. Let's check schema.sql.
              -- Schema has: nombre_completo, rol, avatar_url, fecha_nacimiento. NO email.
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: I need to make sure the insert matches the schema. 
-- Schema: id, nombre_completo, rol, avatar_url, fecha_nacimiento.
-- So I should rely on the metadata passed during signUp.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre_completo, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'jugador')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
