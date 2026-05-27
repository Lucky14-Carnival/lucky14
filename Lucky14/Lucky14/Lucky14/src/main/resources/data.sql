INSERT INTO users (username, password, role, is_active, branch_id)
SELECT 'Allen',
       '$2a$10$DC7sYdJgAwyaw08YiLclded.6OJVBaqPWTP20MjDffYNCAcaI9HQi',
       'SUPER_ADMIN',
       1,
       NULL
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1
    FROM users
    WHERE username = 'Allen'
);

INSERT INTO contact_info (user_id, type, value)
SELECT u.id, 'email', 'lucky14carnival@gmail.com'
FROM users u
WHERE u.username = 'Allen'
  AND NOT EXISTS (
      SELECT 1
      FROM contact_info c
      WHERE c.user_id = u.id
        AND c.type = 'email'
  );

INSERT INTO contact_info (user_id, type, value)
SELECT u.id, 'phone', '09388052521'
FROM users u
WHERE u.username = 'Allen'
  AND NOT EXISTS (
      SELECT 1
      FROM contact_info c
      WHERE c.user_id = u.id
        AND c.type = 'phone'
  );
