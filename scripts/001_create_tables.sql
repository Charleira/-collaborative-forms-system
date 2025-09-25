-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create forms table
CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on forms
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Forms policies
CREATE POLICY "forms_select_own" ON public.forms FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "forms_select_public" ON public.forms FOR SELECT USING (is_public = true AND is_active = true);
CREATE POLICY "forms_insert_own" ON public.forms FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "forms_update_own" ON public.forms FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "forms_delete_own" ON public.forms FOR DELETE USING (auth.uid() = owner_id);

-- Create form_items table (items available in each form)
CREATE TABLE IF NOT EXISTS public.form_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  initial_stock INTEGER NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  max_per_response INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on form_items
ALTER TABLE public.form_items ENABLE ROW LEVEL SECURITY;

-- Form items policies - allow public read for active forms, owner can manage
CREATE POLICY "form_items_select_public" ON public.form_items 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = form_items.form_id 
      AND forms.is_public = true 
      AND forms.is_active = true
    )
  );
CREATE POLICY "form_items_manage_owner" ON public.form_items 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = form_items.form_id 
      AND forms.owner_id = auth.uid()
    )
  );

-- Create form_responses table
CREATE TABLE IF NOT EXISTS public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  respondent_name TEXT,
  respondent_email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on form_responses
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- Form responses policies - public can insert, owner can view
CREATE POLICY "form_responses_insert_public" ON public.form_responses 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = form_responses.form_id 
      AND forms.is_public = true 
      AND forms.is_active = true
    )
  );
CREATE POLICY "form_responses_select_owner" ON public.form_responses 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = form_responses.form_id 
      AND forms.owner_id = auth.uid()
    )
  );

-- Create response_items table (items selected in each response)
CREATE TABLE IF NOT EXISTS public.response_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.form_responses(id) ON DELETE CASCADE,
  form_item_id UUID NOT NULL REFERENCES public.form_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on response_items
ALTER TABLE public.response_items ENABLE ROW LEVEL SECURITY;

-- Response items policies
CREATE POLICY "response_items_insert_public" ON public.response_items 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.form_responses fr
      JOIN public.forms f ON f.id = fr.form_id
      WHERE fr.id = response_items.response_id 
      AND f.is_public = true 
      AND f.is_active = true
    )
  );
CREATE POLICY "response_items_select_owner" ON public.response_items 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.form_responses fr
      JOIN public.forms f ON f.id = fr.form_id
      WHERE fr.id = response_items.response_id 
      AND f.owner_id = auth.uid()
    )
  );

-- Create function to update stock when response is submitted
CREATE OR REPLACE FUNCTION update_stock_on_response()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease stock for the selected item
  UPDATE public.form_items 
  SET current_stock = current_stock - NEW.quantity
  WHERE id = NEW.form_item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stock
DROP TRIGGER IF EXISTS trigger_update_stock ON public.response_items;
CREATE TRIGGER trigger_update_stock
  AFTER INSERT ON public.response_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_response();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
