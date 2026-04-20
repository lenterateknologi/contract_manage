# Contract Management System Tooling
# Usage: make <target>

PHP := /Users/wahyudi.ramadhan/.config/herd-lite/bin/php
ARTISAN := $(PHP) artisan

.PHONY: help install db-fresh db-seed-master db-seed-sample

help: ## Show this help documentation
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Fresh installation (Wipe DB, Migrate, and Seed Master Data)
	@echo "Starting fresh installation..."
	$(ARTISAN) migrate:fresh
	$(ARTISAN) db:seed --class=MasterSeeder
	@echo "Installation complete. Master data initialized."

db-fresh: ## Wipe and rebuild the database from clean baselines
	@echo "Rebuilding database structure..."
	$(ARTISAN) migrate:fresh
	@echo "Database is now empty and structured with new naming conventions."

db-seed-master: ## Seed only the Master Data (m_ tables)
	@echo "Seeding Master data..."
	$(ARTISAN) db:seed --class=MasterSeeder
	@echo "Master data seeding complete."

db-seed-sample: ## Seed Master Data and Sample Transactional Data (t_ tables)
	@echo "Seeding Master and Sample data..."
	$(ARTISAN) db:seed --class=MasterSeeder
	$(ARTISAN) db:seed --class=SampleSeeder
	@echo "Full data seeding complete."

clear-cache: ## Clear all application caches
	$(ARTISAN) cache:clear
	$(ARTISAN) route:clear
	$(ARTISAN) config:clear
	$(ARTISAN) view:clear
	@echo "Caches cleared."
