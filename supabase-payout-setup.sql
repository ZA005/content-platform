-- Payout Configuration Table
CREATE TABLE IF NOT EXISTS payout_configurations (
  id TEXT PRIMARY KEY DEFAULT 'default',
  payout_day_of_month INTEGER NOT NULL DEFAULT 15,
  default_day_off_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  default_working_days INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5],
  role_defaults JSONB DEFAULT '{"creator": {}, "manager": {}}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO payout_configurations (id, payout_day_of_month, default_day_off_multiplier, default_working_days, role_defaults)
VALUES ('default', 15, 1.5, ARRAY[1, 2, 3, 4, 5], '{"creator": {}, "manager": {}}')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE payout_configurations ENABLE ROW LEVEL SECURITY;

-- Compensation Profiles Table
CREATE TABLE IF NOT EXISTS compensation_profiles (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('creator', 'manager')),
  base_salary_centavos INTEGER NOT NULL,
  day_off_multiplier NUMERIC,
  effective_date DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE compensation_profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_compensation_user_id ON compensation_profiles(user_id);

-- Work Schedules Table
CREATE TABLE IF NOT EXISTS work_schedules (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  working_days INTEGER[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5],
  custom_days_off TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_work_schedule_user_id ON work_schedules(user_id);

-- Finalized Payouts Table
CREATE TABLE IF NOT EXISTS finalized_payouts (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  user_id UUID NOT NULL,
  summary JSONB NOT NULL,
  daily_breakdown JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(month, user_id)
);

ALTER TABLE finalized_payouts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_finalized_payouts_month ON finalized_payouts(month);
CREATE INDEX idx_finalized_payouts_user_month ON finalized_payouts(user_id, month);

-- RLS Policies for Payout Configuration
CREATE POLICY payout_config_admin_read ON payout_configurations
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY payout_config_admin_update ON payout_configurations
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policies for Compensation Profiles
CREATE POLICY compensation_select_own ON compensation_profiles
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY compensation_admin_read ON compensation_profiles
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY compensation_admin_insert ON compensation_profiles
  FOR INSERT WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY compensation_admin_update ON compensation_profiles
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY compensation_admin_delete ON compensation_profiles
  FOR DELETE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policies for Work Schedules
CREATE POLICY work_schedule_select_own ON work_schedules
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY work_schedule_admin_read ON work_schedules
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY work_schedule_admin_insert ON work_schedules
  FOR INSERT WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY work_schedule_admin_update ON work_schedules
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY work_schedule_user_delete ON work_schedules
  FOR DELETE USING (
    user_id = auth.uid()
  );

CREATE POLICY work_schedule_admin_delete ON work_schedules
  FOR DELETE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policies for Finalized Payouts
CREATE POLICY finalized_payouts_select_own ON finalized_payouts
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY finalized_payouts_admin_read ON finalized_payouts
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY finalized_payouts_admin_insert ON finalized_payouts
  FOR INSERT WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY finalized_payouts_admin_update ON finalized_payouts
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY finalized_payouts_admin_delete ON finalized_payouts
  FOR DELETE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
