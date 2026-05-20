import { test, expect } from '@playwright/test';

test.describe('Multi-Level Contract Approval Workflow', () => {
    
  test('should complete a full approval cycle from Staff to Manager', async ({ page }) => {
    // === TAHAP 1: STAFF MENGAJUKAN KONTRAK ===
    await page.goto('/login');
    await page.fill('#email', 'ahmad@example.com');
    await page.fill('#password', 'password');
    await page.click('button:has-text("Log in")');

    await expect(page).toHaveURL(/.*dashboard/);
    await page.click('text=Daftar Kontrak');
    
    // Buat Kontrak Baru
    const contractName = `Workflow Test ${Date.now()}`;
    await page.click('button:has-text("KONTRAK BARU")');
    await page.fill('input[placeholder="Masukkan judul kontrak"]', contractName);
    await page.locator('select').nth(0).selectOption({ index: 1 }); // Submission Type
    await page.locator('select').nth(1).selectOption({ index: 1 }); // Contract Type
    await page.click('button:has-text("Buat Kontrak")');

    // Tunggu redirect ke detail
    await expect(page).toHaveURL(/.*contracts\/[a-f0-9-]*/);

    // Isi F1 (Wajib agar bisa dikirim)
    await page.click('button:has-text("Formulir F1")');
    await page.waitForTimeout(1000);
    const formFields = page.locator('.space-y-4 input[type="text"], .space-y-4 textarea');
    if (await formFields.count() > 0) {
        await formFields.first().fill('Data Test Otomatis');
    }
    await page.click('button:has-text("Simpan Formulir")');
    await page.waitForTimeout(2500);

    // Kirim untuk Approval
    await page.click('button:has-text("Kirim Approval")');
    await expect(page.locator('text=Konfirmasi alur persetujuan')).toBeVisible();
    await page.click('button:has-text("Konfirmasi & Kirim")');
    
    // Verifikasi Status In Review
    await expect(page.locator('text=In Review').first()).toBeVisible();

    // === LOGOUT STAFF ===
    // Klik menu user di pojok kiri bawah (Sidebar Footer)
    await page.locator('button[aria-haspopup="menu"]').last().click();
    await page.click('button:has-text("Log out")');
    await expect(page).toHaveURL(/.*login/);

    // === TAHAP 2: MANAGER MENYETUJUI KONTRAK ===
    await page.fill('#email', 'budi@example.com'); // Manager Legal/Staff
    await page.fill('#password', 'password');
    await page.click('button:has-text("Log in")');

    await expect(page).toHaveURL(/.*dashboard/);
    
    // Navigasi ke menu Persetujuan
    await page.click('text=Persetujuan');
    
    // Cari kontrak yang baru dibuat (baris pertama biasanya yang terbaru)
    const contractRow = page.locator('tr').filter({ hasText: contractName });
    await expect(contractRow).toBeVisible();
    await contractRow.click();

    // Berikan Persetujuan
    await expect(page.locator('text=Persetujuan Diperlukan')).toBeVisible();
    await page.fill('textarea[placeholder*="Catatan"]', 'Disetujui secara otomatis melalui Playwright Testing');
    await page.click('button:has-text("Setujui")');

    // Konfirmasi di Modal
    await page.click('button:has-text("Ya, Setujui")');

    // === VERIFIKASI AKHIR ===
    // Cek apakah ada indikator keberhasilan (Toast atau perubahan status di detail)
    await expect(page.locator('text=In Review').or(page.locator('text=Approved'))).toBeVisible();
    
    // Logout Manager
    await page.locator('button[aria-haspopup="menu"]').last().click();
    await page.click('button:has-text("Log out")');
  });
});
