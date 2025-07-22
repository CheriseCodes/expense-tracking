CREATE TABLE users (
	user_id uuid DEFAULT gen_random_uuid(),
	username varchar NOT NULL,
	email varchar NOT NULL,
	password_hash char(73) NOT NULL, -- max length using bcrypt is 72
	role varchar(30) NOT NULL, -- regular user, admin or something else
	created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	last_login timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        categories bigint[], -- array of category ids
	PRIMARY KEY(user_id)
);

CREATE TABLE categories (
	category_id uuid DEFAULT gen_random_uuid(),
	category_name varchar NOT NULL,
	PRIMARY KEY(category_id)
);

CREATE TABLE expenses (
	expense_id uuid DEFAULT gen_random_uuid() UNIQUE,
	user_id uuid NOT NULL,
	item varchar NOT NULL,
	vendor varchar NOT NULL,
	price decimal(12,2) NOT NULL,
	date_purchased date NOT NULL,
	payment_method varchar,
	notes varchar,
	created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (expense_id, user_id),
	CONSTRAINT fk_user
		FOREIGN KEY(user_id)
			REFERENCES users(user_id)
				ON DELETE CASCADE
);

CREATE TABLE expense_categories (
	expense_id uuid NOT NULL,
        category_id uuid NOT NULL,
	PRIMARY KEY (expense_id, category_id),
	CONSTRAINT fk_expense
		FOREIGN KEY(expense_id)
			REFERENCES expenses(expense_id)
				ON DELETE CASCADE,
        CONSTRAINT fk_category
                FOREIGN KEY(category_id)
                        REFERENCES categories(category_id) 	
				ON DELETE CASCADE
);

CREATE TABLE wishlist (
	wish_id uuid DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL,
	item varchar NOT NULL,
	vendor varchar,
	price decimal(12,2) NOT NULL,
	priority int NOT NULL,
	status varchar(20) NOT NULL, -- wished, scheduled, bought
	notes varchar,
	planned_date date,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (wish_id, user_id),
        CONSTRAINT fk_user
                FOREIGN KEY(user_id)
                        REFERENCES users(user_id)
				ON DELETE CASCADE
);

CREATE TABLE budgets (
	budget_id uuid DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL,
	category_id uuid NOT NULL,
	current_spend decimal(12, 2) NOT NULL,
	future_spend decimal(12, 2) NOT NULL,
	max_spend decimal(12, 2) NOT NULL,
	is_over_max boolean NOT NULL,
        start_date date NOT NULL,
        end_date date NOT NULL,
	PRIMARY KEY(budget_id, user_id),
	CONSTRAINT fk_user
                FOREIGN KEY(user_id)
                        REFERENCES users(user_id)
				ON DELETE CASCADE,
        CONSTRAINT fk_category
                FOREIGN KEY(category_id)
                        REFERENCES categories(category_id)
				ON DELETE CASCADE
);
