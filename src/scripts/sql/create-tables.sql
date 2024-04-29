CREATE TABLE users (
	user_id uuid DEFAULT gen_random_uuid(),
	username varchar NOT NULL,
	email varchar NOT NULL,
	password_hash char(73) binary, # max length using bcrypt is 72
	role char(30) NOT NULL, # regular user, admin or something else
	created_at timestamp NOT NULL,
	last_login timestamp NOT NULL,
	PRIMARY KEY(user_id)
);

CREATE TABLE categories (
	category_id bitint DEFAULT nextval('integer_id_seq'),
	category_name varchar NOT NULL,
	PRIMARY KEY(category_id)
);

CREATE TABLE expenses (
	expense_id bigint DEFAULT nextval('integer_id_seq'),
	user_id uuid NOT NULL,
	item varchar NOT NULL,
	vendor varchar NOT NULL,
	price decimal(12,2) NOT NULL,
	date_purchased date NOT NULL,
	notes varchar,
	created_at timestamp NOT NULL,
	PRIMARY KEY (expense_id, user_id),
	CONSTRAINT fk_user
		FOREIGN KEY(user_id)
			REFERENCES users(user_id)
);

CREATE TABLE expense_categories (
	expense_id bigint NOT NULL,
        category_id bigint NOT NULL,
	PRIMARY KEY (expense_id, category_id),
	CONSTRAINT fk_expense
		FOREIGN KEY(expense_id)
			REFERENCES expenses(expense_id)
        CONSTRAINT fk_category
                FOREIGN KEY(category_id)
                        REFERENCES expenses(category_id) 	
);

CREATE TABLE wishlist (
	wish_id bigint DEFAULT nextval('integer_id_seq'),
	user_id uuid NOT NULL,
	item varchar NOT NULL,
	vendor varchar,
	price decimal(12,2) NOT NULL,
	priority int NOT NULL,
	status char(20) NOT NULL, # wished, scheduled, bought
	notes varchar,
	planned_date date,
	created_at timestamp,
        PRIMARY KEY (wish_id, user_id)
        CONSTRAINT fk_user
                FOREIGN KEY(user_id)
                        REFERENCES users(user_id)
);

CREATE TABLE budgets (
	budget_id bigint DEFAULT nextval('integer_id_seq'),
	user_id uuid NOT NULL,
	category_id bigint NOT NULL,
	current_spend decimal(12, 2) NOT NULL,
	future_spend decimal(12, 2) NOT NULL,
	max_spend decimal(12, 2) NOT NULL,
	is_over_max boolean NOT NULL,
	PRIMARY KEY(budget_id, user_id)
	CONSTRAINT fk_user
                FOREIGN KEY(user_id)
                        REFERENCES users(user_id)
        CONSTRAINT fk_category
                FOREIGN KEY(category_id)
                        REFERENCES expenses(category_id)
);
