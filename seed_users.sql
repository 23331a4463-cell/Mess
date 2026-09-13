-- ==============================================================================
-- Mini MES - Clean & Seed Demo Users in Supabase Auth (UUID Cast Fixed)
-- Run this in Supabase SQL Editor to provision all 4 pre-confirmed accounts
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Remove previous/corrupted auth records
DELETE FROM auth.identities WHERE user_id IN (
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'b2222222-2222-2222-2222-222222222222'::uuid,
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'd4444444-4444-4444-4444-444444444444'::uuid
);

DELETE FROM public.profiles WHERE email IN (
    'admin@factory.com', 'supervisor@factory.com', 'operator@factory.com', 'quality@factory.com'
);

DELETE FROM auth.users WHERE email IN (
    'admin@factory.com', 'supervisor@factory.com', 'operator@factory.com', 'quality@factory.com'
);

-- 2. Create users and linked identities
DO $$
DECLARE
    v_admin_id UUID := 'a1111111-1111-1111-1111-111111111111';
    v_super_id UUID := 'b2222222-2222-2222-2222-222222222222';
    v_oper_id  UUID := 'c3333333-3333-3333-3333-333333333333';
    v_qual_id  UUID := 'd4444444-4444-4444-4444-444444444444';
BEGIN
    -- Admin (admin@factory.com / Admin#123!)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_admin_id,
        'authenticated',
        'authenticated',
        'admin@factory.com',
        crypt('Admin#123!', gen_salt('bf')),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Plant Administrator","role":"Admin"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    -- Supervisor (supervisor@factory.com / Super#123!)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_super_id,
        'authenticated',
        'authenticated',
        'supervisor@factory.com',
        crypt('Super#123!', gen_salt('bf')),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Production Supervisor","role":"Supervisor"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    -- Operator (operator@factory.com / Oper#123!)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_oper_id,
        'authenticated',
        'authenticated',
        'operator@factory.com',
        crypt('Oper#123!', gen_salt('bf')),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Senior Machine Operator","role":"Operator"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    -- Quality Inspector (quality@factory.com / Quality#123!)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_qual_id,
        'authenticated',
        'authenticated',
        'quality@factory.com',
        crypt('Quality#123!', gen_salt('bf')),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Quality Assurance Lead","role":"Quality Inspector"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    -- Insert corresponding rows in auth.identities
    -- In your Supabase database, auth.identities.id is type UUID
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES 
        (v_admin_id, v_admin_id, jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@factory.com'), 'email', v_admin_id::text, now(), now(), now()),
        (v_super_id, v_super_id, jsonb_build_object('sub', v_super_id::text, 'email', 'supervisor@factory.com'), 'email', v_super_id::text, now(), now(), now()),
        (v_oper_id,  v_oper_id,  jsonb_build_object('sub', v_oper_id::text,  'email', 'operator@factory.com'),   'email', v_oper_id::text,  now(), now(), now()),
        (v_qual_id,  v_qual_id,  jsonb_build_object('sub', v_qual_id::text,  'email', 'quality@factory.com'),    'email', v_qual_id::text,  now(), now(), now());

    -- Populate public.profiles
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES
        (v_admin_id, 'Plant Administrator', 'admin@factory.com', 'Admin'),
        (v_super_id, 'Production Supervisor', 'supervisor@factory.com', 'Supervisor'),
        (v_oper_id,  'Senior Machine Operator', 'operator@factory.com', 'Operator'),
        (v_qual_id,  'Quality Assurance Lead', 'quality@factory.com', 'Quality Inspector')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

END $$;
