# Design Document: Laravel Framework Optimization (Option 3)

**Date:** 2026-06-04  
**Status:** Draft  
**Target Environment:** VPS (Standard)

## 1. Objective
Optimize the Laravel application for stability, performance, and maintainability. This involves infrastructure tuning for VPS, resolving critical code issues (static analysis errors), and ensuring heavy operations (PDF/Excel) are handled efficiently via background queues.

## 2. Infrastructure & Configuration (VPS Focused)
*   **Process Management**: Implement configuration recommendations for **Supervisor** to manage `php artisan queue:work` and ensure 24/7 background processing.
*   **Caching Strategy**: 
    *   Transition `CACHE_STORE` and `SESSION_DRIVER` to **Redis** (preferred) or `database` to reduce Disk I/O.
    *   Implement `php artisan optimize` (config, route, view caching) as part of the deployment checklist.
*   **PHP Tuning**: Recommend OPcache settings (`opcache.validate_timestamps=0` for production) to minimize CPU usage.
*   **Web Server (Nginx)**: Enable Gzip/Brotli compression and set long-term `Cache-Control` headers for Vite assets.

## 3. Database Performance
*   **Eager Loading Audit**: 
    *   Target: `ContractController`, `WorkflowAdminController`, and `ContractApprovalController`.
    *   Action: Replace lazy loading with `with()` for relations like `contractType`, `approvers`, and `department`.
*   **Indexing**: 
    *   Create a migration to add database indexes on frequently filtered columns: `status`, `contract_no`, `user_id`, and `created_at`.
*   **Strict Mode**: Leverage existing `Model::shouldBeStrict()` to prevent N+1 queries during development.

## 4. Code Stability & "Surgical" Fixes
*   **Static Analysis (PHPStan)**:
    *   Focus on `app/Actions/Contract` and `app/Models`.
    *   Fix "undefined property" errors by adding proper DocBlocks (`@property`) or using Eloquent Caching/Accessors where appropriate.
*   **Heavy Operations (PDF/Excel)**:
    *   Configure `Browsershot` for Linux VPS compatibility (e.g., `--no-sandbox`).
    *   Ensure `GeneratePdfJob` has appropriate `$timeout` and `$tries` properties to handle queue failures gracefully.

## 5. Success Criteria
*   Application responds significantly faster due to config/route caching.
*   Heavy PDF/Excel exports do not block the main UI (processed via Queue).
*   Zero critical PHPStan errors in the core `Actions` and `Models` directories.
*   Stable memory usage on the VPS during concurrent operations.

## 6. Testing Strategy
*   **Performance**: Compare response times before and after `artisan optimize`.
*   **Functional**: Verify PDF generation and Excel export success via `php artisan queue:work`.
*   **Stability**: Run `vendor/bin/phpstan` on modified directories to ensure error count is reduced.
