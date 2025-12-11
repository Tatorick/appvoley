-- FIX: robust handle_new_user with search_path
-- Dropping previous objects to be clean
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre_completo, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'jugador'::public.app_role)
  )
  ON CONFLICT (id) DO UPDATE SET
    nombre_completo = EXCLUDED.nombre_completo,
    rol = EXCLUDED.rol;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
