-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','instructor','student');
CREATE TYPE public.application_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.attendance_status AS ENUM ('present','late','absent','excused');
CREATE TYPE public.account_status AS ENUM ('active','suspended');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  city text,
  bio text,
  avatar_url text,
  status public.account_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','instructor'));
$$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- new user handling: profile + role (first user becomes admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  admin_exists boolean;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO admin_exists;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN admin_exists THEN 'student'::public.app_role ELSE 'admin'::public.app_role END)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- COURSES
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  level text NOT NULL DEFAULT 'Beginner',
  duration_weeks int NOT NULL DEFAULT 8,
  fee numeric(12,2) NOT NULL DEFAULT 0,
  outline text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_public_read" ON public.courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "courses_admin_write" ON public.courses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- COHORTS
CREATE TABLE public.cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  capacity int NOT NULL DEFAULT 30,
  mode text NOT NULL DEFAULT 'online',
  schedule text NOT NULL DEFAULT 'weekend',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cohorts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cohorts TO authenticated;
GRANT ALL ON public.cohorts TO service_role;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cohorts_public_read" ON public.cohorts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "cohorts_admin_write" ON public.cohorts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- APPLICATIONS
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  date_of_birth date,
  gender text,
  city text,
  education text,
  occupation text,
  experience_level text,
  has_computer boolean NOT NULL DEFAULT true,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  preferred_start date,
  preferred_schedule text,
  learning_mode text,
  goals text NOT NULL DEFAULT '',
  referral_source text,
  questions text,
  status public.application_status NOT NULL DEFAULT 'pending',
  review_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  student_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_public_insert" ON public.applications FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
CREATE POLICY "applications_staff_read" ON public.applications FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR student_id = auth.uid());
CREATE POLICY "applications_admin_write" ON public.applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "applications_admin_delete" ON public.applications FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ENROLLMENTS
CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, cohort_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments_read" ON public.enrollments FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "enrollments_admin_write" ON public.enrollments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.is_in_cohort(_user_id uuid, _cohort_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.enrollments WHERE student_id = _user_id AND cohort_id = _cohort_id AND status = 'active');
$$;

-- CLASS SESSIONS
CREATE TABLE public.class_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  topic text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 120,
  instructor text,
  meeting_link text,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_sessions TO authenticated;
GRANT ALL ON public.class_sessions TO service_role;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_read" ON public.class_sessions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR public.is_in_cohort(auth.uid(), cohort_id));
CREATE POLICY "sessions_staff_write" ON public.class_sessions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ATTENDANCE
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL DEFAULT 'present',
  note text,
  marked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_read" ON public.attendance FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "attendance_staff_write" ON public.attendance FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ASSIGNMENTS
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  title text NOT NULL,
  brief text NOT NULL DEFAULT '',
  due_at timestamptz NOT NULL,
  max_score int NOT NULL DEFAULT 100,
  resource_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assignments_read" ON public.assignments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR public.is_in_cohort(auth.uid(), cohort_id));
CREATE POLICY "assignments_staff_write" ON public.assignments FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- SUBMISSIONS
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  file_url text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  score int,
  feedback text,
  graded_at timestamptz,
  graded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (assignment_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions_read" ON public.submissions FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "submissions_student_insert" ON public.submissions FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "submissions_student_update" ON public.submissions FOR UPDATE TO authenticated USING (student_id = auth.uid() AND graded_at IS NULL) WITH CHECK (student_id = auth.uid());
CREATE POLICY "submissions_staff_update" ON public.submissions FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "submissions_staff_delete" ON public.submissions FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid REFERENCES public.cohorts(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements_read" ON public.announcements FOR SELECT TO authenticated USING (cohort_id IS NULL OR public.is_staff(auth.uid()) OR public.is_in_cohort(auth.uid(), cohort_id));
CREATE POLICY "announcements_staff_write" ON public.announcements FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- SEED
INSERT INTO public.courses (id, slug, title, summary, description, level, duration_weeks, fee, outline, sort_order) VALUES
('11111111-1111-4111-8111-111111111101','excel-foundations','Excel & Data Foundations','Master spreadsheets, cleaning and dashboarding from zero.','Build the foundation every analyst needs: structured data, formulas, pivot tables, cleaning workflows and clear dashboards.','Beginner',6,120000,ARRAY['Spreadsheet fundamentals','Formulas & functions','Data cleaning','Pivot tables','Dashboard design','Capstone report'],1),
('11111111-1111-4111-8111-111111111102','sql-analytics','SQL for Analytics','Query, join and aggregate real databases with confidence.','Go from SELECT to window functions. Work with real relational datasets and answer business questions in SQL.','Beginner',8,150000,ARRAY['Relational thinking','SELECT & filtering','Joins','Aggregations','Subqueries & CTEs','Window functions'],2),
('11111111-1111-4111-8111-111111111103','power-bi','Power BI & Visual Analytics','Turn raw data into decision-ready dashboards.','Model data, write DAX and design dashboards stakeholders actually use.','Intermediate',8,180000,ARRAY['Power Query','Data modelling','DAX essentials','Visual design','Row-level security','Publishing & sharing'],3),
('11111111-1111-4111-8111-111111111104','python-analytics','Python for Data Analysis','Automate analysis with pandas and visual storytelling.','Use Python, pandas and matplotlib to analyse datasets at scale and automate repetitive reporting.','Intermediate',10,220000,ARRAY['Python basics','pandas','Data wrangling','Visualisation','Statistics primer','Automation project'],4),
('11111111-1111-4111-8111-111111111105','bootcamp','Full Data Analytics Bootcamp','The complete career track: Excel, SQL, Power BI and Python.','Our flagship programme. Everything from spreadsheets to Python, plus portfolio projects, CV clinic and interview prep.','All levels',24,450000,ARRAY['Excel & foundations','SQL','Power BI','Python & pandas','Portfolio projects','Career & interview prep'],5);

INSERT INTO public.cohorts (id, course_id, name, start_date, end_date, capacity, mode, schedule, status) VALUES
('22222222-2222-4222-8222-222222222201','11111111-1111-4111-8111-111111111105','Bootcamp Cohort 07', CURRENT_DATE - 14, CURRENT_DATE + 154, 40, 'hybrid', 'weekend', 'open'),
('22222222-2222-4222-8222-222222222202','11111111-1111-4111-8111-111111111102','SQL Evening Cohort 03', CURRENT_DATE + 21, CURRENT_DATE + 77, 30, 'online', 'evening', 'open');

INSERT INTO public.class_sessions (cohort_id, topic, description, starts_at, duration_minutes, instructor, meeting_link) VALUES
('22222222-2222-4222-8222-222222222201','Orientation & Analytics Mindset','How analysts think, tooling setup and course roadmap.', (CURRENT_DATE - 14)::timestamptz + interval '10 hours',120,'Instructor TBD','https://meet.example.com/synalyx-1'),
('22222222-2222-4222-8222-222222222201','Spreadsheet Fundamentals','Structured data, references and core formulas.', (CURRENT_DATE - 7)::timestamptz + interval '10 hours',150,'Instructor TBD','https://meet.example.com/synalyx-2'),
('22222222-2222-4222-8222-222222222201','Data Cleaning Workshop','Handling messy, real-world datasets.', (CURRENT_DATE + 2)::timestamptz + interval '10 hours',150,'Instructor TBD','https://meet.example.com/synalyx-3'),
('22222222-2222-4222-8222-222222222201','Pivot Tables & Dashboards','Summarising data and building your first dashboard.', (CURRENT_DATE + 9)::timestamptz + interval '10 hours',150,'Instructor TBD','https://meet.example.com/synalyx-4'),
('22222222-2222-4222-8222-222222222201','Intro to SQL','Databases, tables and the SELECT statement.', (CURRENT_DATE + 16)::timestamptz + interval '10 hours',150,'Instructor TBD','https://meet.example.com/synalyx-5');

INSERT INTO public.assignments (cohort_id, title, brief, due_at, max_score) VALUES
('22222222-2222-4222-8222-222222222201','Sales Data Cleaning','Clean the supplied sales export: remove duplicates, standardise dates and currencies, then summarise revenue by region. Submit a link to your workbook and a short note on the decisions you made.', (CURRENT_DATE + 5)::timestamptz + interval '20 hours',100),
('22222222-2222-4222-8222-222222222201','First Dashboard','Build a one-page dashboard answering three business questions from the cleaned dataset. Explain your layout choices.', (CURRENT_DATE + 12)::timestamptz + interval '20 hours',100);

INSERT INTO public.announcements (cohort_id, title, body) VALUES
(NULL,'Welcome to SYNALYX','Your portal is live. Check your schedule, submit assignments here and track your attendance in one place.'),
('22222222-2222-4222-8222-222222222201','Bring your laptop to Saturday session','We will be working hands-on with the sales dataset. Install the tools listed in the orientation notes beforehand.');