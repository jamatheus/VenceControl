-- SQL Script to create the necessary tables for VenceControl

-- 1. Create the 'batches' table
CREATE TABLE public.batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre_producto TEXT NOT NULL,
    numero_lote TEXT NOT NULL,
    fecha_vencimiento TIMESTAMP WITH TIME ZONE NOT NULL,
    registrado_por TEXT NOT NULL,
    id_usuario UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
-- Allow users to read all batches (or you can restrict to only their own)
CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON public.batches 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to insert their own batches
CREATE POLICY "Permitir inserción a usuarios autenticados" 
ON public.batches 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id_usuario);

-- Allow users to update their own batches
CREATE POLICY "Permitir actualización de sus propios registros" 
ON public.batches 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id_usuario);

-- Allow users to delete their own batches
CREATE POLICY "Permitir eliminación de sus propios registros" 
ON public.batches 
FOR DELETE 
TO authenticated 
USING (auth.uid() = id_usuario);
