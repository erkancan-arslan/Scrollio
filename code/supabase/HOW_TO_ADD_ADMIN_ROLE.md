# How to give a user the Admin role

The admin panel checks the `user_roles` table. You need one row with `role = 'admin'` for your user.

---

## Step 1: Get your user ID (UUID)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. In the left sidebar click **Authentication** → **Users**.
3. Find your account in the list. Click it (or note the row).
4. Copy the **User UID** (it looks like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

That value is your `user_id`.

---

## Step 2: Add the admin role (pick one method)

### Option A: Using the SQL Editor (recommended)

1. In Supabase Dashboard, go to **SQL Editor**.
2. Click **New query**.
3. Paste this (replace `YOUR_USER_ID_HERE` with the UUID you copied):

```sql
-- Replace YOUR_USER_ID_HERE with your actual User UID from Authentication → Users
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

4. Click **Run** (or press Ctrl+Enter).
5. You should see “Success. No rows returned” or “1 row inserted”. Done.

---

### Option B: Using the Table Editor

1. In Supabase Dashboard, go to **Table Editor**.
2. Select the **user_roles** table (under `public`).
3. Click **Insert row** (or the + button).
4. Fill in:
   - **user_id**: paste your User UID from Step 1.
   - **role**: choose `admin` from the dropdown (if `admin` is not in the list, run the migration `20260210200100_add_admin_role.sql` first).
   - Leave **id**, **granted_at**, **granted_by** as default/empty if the table allows it.
5. Save the row.

---

## Step 3: Use the app

1. Log in to the app with that same account (the one whose UUID you used).
2. On the landing screen, tap **Admin**.
3. You should see the Admin Dashboard; API calls will now pass the role check.

---

## Troubleshooting

- **“admin” not in role dropdown**  
  Run the migration that adds the enum value:  
  `code/supabase/migrations/20260210200100_add_admin_role.sql`

- **Duplicate key error**  
  That user already has the `admin` role. No need to insert again.

- **403 on admin API**  
  Make sure you are logged in with the same user that has the admin row in `user_roles`, and that the app sends the Supabase access token in the `Authorization` header.
