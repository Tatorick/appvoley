-- FIX: Remove 'email' column from insert, as it doesn't exist in profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre_completo, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'jugador')
  )
  ON CONFLICT (id) DO UPDATE SET
    nombre_completo = EXCLUDED.nombre_completo,
    rol = EXCLUDED.rol;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
