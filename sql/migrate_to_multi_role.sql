| function_name    | arguments                          | return_type | function_definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| set_primary_role | user_id_param uuid, role_name text | boolean     | CREATE OR REPLACE FUNCTION public.set_primary_role(user_id_param uuid, role_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  role_id_var INTEGER;
  has_role BOOLEAN;
BEGIN
  -- Get the role ID
  SELECT id INTO role_id_var FROM public.roles WHERE name = role_name;
  
  IF role_id_var IS NULL THEN
    RAISE NOTICE 'Role % does not exist', role_name;
    RETURN FALSE; -- Role doesn't exist
  END IF;
  
  -- Check if user has this role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param AND role_id = role_id_var
  ) INTO has_role;
  
  IF NOT has_role THEN
    RAISE NOTICE 'User does not have role %', role_name;
    RETURN FALSE; -- User doesn't have this role
  END IF;
  
  -- Set all roles to non-primary
  UPDATE public.user_roles
  SET is_primary = FALSE
  WHERE user_id = user_id_param;
  
  -- Set the specified role as primary
  UPDATE public.user_roles
  SET is_primary = TRUE
  WHERE user_id = user_id_param AND role_id = role_id_var;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in set_primary_role: %', SQLERRM;
  RETURN FALSE;
END;
$function$
 |