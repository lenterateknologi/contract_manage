# Theme Configuration - Agreement App

## 🎨 Theme Variables

### Theme 1: Professional Blue

```
--primary: #1e5a9e
--primary-hover: #154073
--primary-active: #0f2a4a
--primary-light: #e8f0f7

--secondary: #f5f7fa
--accent: #00a86b
--text-dark: #2c3e50
--text-light: #666666
--text-muted: #999999
--border: #ddd
--background: #f5f7fa
--white: #ffffff

--success: #28a745
--warning: #ffc107
--danger: #dc3545
--info: #17a2b8
```

### Theme 2: Modern Green

```
--primary: #00a86b
--primary-hover: #008a56
--primary-active: #006b41
--primary-light: #e6f5f0

--secondary: #f0f8f4
--accent: #1e5a9e
--text-dark: #2c3e50
--text-light: #666666
--text-muted: #999999
--border: #ddd
--background: #f0f8f4
--white: #ffffff

--success: #28a745
--warning: #ffc107
--danger: #dc3545
--info: #17a2b8
```

### Theme 3: Elegant Charcoal

```
--primary: #2c3e50
--primary-hover: #1a2332
--primary-active: #0f1419
--primary-light: #ecf0f1

--secondary: #ecf0f1
--accent: #00a86b
--text-dark: #2c3e50
--text-light: #666666
--text-muted: #999999
--border: #ddd
--background: #ecf0f1
--white: #ffffff

--success: #28a745
--warning: #ffc107
--danger: #dc3545
--info: #17a2b8
```

---

## 📐 Typography

```
--font-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
--font-mono: 'Courier New', monospace

--font-size-h1: 28px
--font-size-h2: 20px
--font-size-h3: 18px
--font-size-body: 14px
--font-size-small: 12px

--font-weight-light: 300
--font-weight-regular: 400
--font-weight-semibold: 600
--font-weight-bold: 700

--line-height-heading: 1.2
--line-height-body: 1.5
--line-height-caption: 1.4
```

---

## 🔲 Spacing

```
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 12px
--spacing-base: 16px
--spacing-lg: 20px
--spacing-xl: 24px
--spacing-2xl: 32px
--spacing-3xl: 40px
```

---

## 🎯 Border Radius

```
--radius-sm: 4px
--radius-md: 6px
--radius-lg: 8px
--radius-full: 50%
```

---

## 💫 Shadows

```
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.05)
--shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.08)
--shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.1)
```

---

## ⚡ Component Colors

### Buttons

#### Primary Button

```
Background: var(--primary)
Text: var(--white)
Hover: var(--primary-hover)
Active: var(--primary-active)
Disabled: #cccccc
```

#### Secondary Button

```
Background: var(--secondary)
Text: var(--text-dark)
Border: var(--border)
Hover: #e8e8e8
Active: #d0d0d0
```

#### Danger Button

```
Background: var(--danger)
Text: var(--white)
Hover: #c82333
Active: #a71d2a
```

### Input Fields

```
Background: var(--white)
Border: var(--border)
Text: var(--text-dark)
Placeholder: var(--text-muted)
Focus Border: var(--primary)
Focus Shadow: 0 0 0 3px rgba(var(--primary), 0.1)
```

### Status Badges

#### Success

```
Background: #d4edda
Text: #155724
Border: #c3e6cb
```

#### Warning

```
Background: #fff3cd
Text: #856404
Border: #ffeeba
```

#### Danger

```
Background: #f8d7da
Text: #721c24
Border: #f5c6cb
```

#### Info

```
Background: #d1ecf1
Text: #0c5460
Border: #bee5eb
```

### Cards

```
Background: var(--white)
Border: none
Shadow: var(--shadow-md)
Radius: var(--radius-lg)
Padding: var(--spacing-lg)
```

---

## 📱 Responsive Breakpoints

```
--breakpoint-mobile: 576px
--breakpoint-tablet: 768px
--breakpoint-desktop: 992px
--breakpoint-wide: 1200px
```

---

## 🔄 Transitions

```
--transition-fast: 150ms ease-in-out
--transition-base: 300ms ease-in-out
--transition-slow: 500ms ease-in-out
```

---

## 📋 Accessibility

```
--contrast-high: 7:1 (AAA)
--contrast-medium: 4.5:1 (AA)
--contrast-min: 3:1
```

---

## CSS Custom Properties Template

```css
:root {
    /* Colors - Professional Blue Theme */
    --primary: #1e5a9e;
    --primary-hover: #154073;
    --primary-active: #0f2a4a;
    --primary-light: #e8f0f7;

    --secondary: #f5f7fa;
    --accent: #00a86b;

    --text-dark: #2c3e50;
    --text-light: #666666;
    --text-muted: #999999;

    --border: #ddd;
    --background: #f5f7fa;
    --white: #ffffff;

    --success: #28a745;
    --warning: #ffc107;
    --danger: #dc3545;
    --info: #17a2b8;

    /* Typography */
    --font-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    --font-mono: 'Courier New', monospace;

    --font-size-h1: 28px;
    --font-size-h2: 20px;
    --font-size-h3: 18px;
    --font-size-body: 14px;
    --font-size-small: 12px;

    --font-weight-light: 300;
    --font-weight-regular: 400;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;

    --line-height-heading: 1.2;
    --line-height-body: 1.5;

    /* Spacing */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 12px;
    --spacing-base: 16px;
    --spacing-lg: 20px;
    --spacing-xl: 24px;
    --spacing-2xl: 32px;
    --spacing-3xl: 40px;

    /* Borders & Radius */
    --radius-sm: 4px;
    --radius-md: 6px;
    --radius-lg: 8px;

    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.05);
    --shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.08);

    /* Breakpoints */
    --breakpoint-tablet: 768px;
    --breakpoint-desktop: 1200px;

    /* Transitions */
    --transition-base: 300ms ease-in-out;
}
```

---

## JSON Format

```json
{
    "theme": {
        "colors": {
            "primary": "#1e5a9e",
            "secondary": "#f5f7fa",
            "accent": "#00a86b",
            "success": "#28a745",
            "warning": "#ffc107",
            "danger": "#dc3545",
            "info": "#17a2b8",
            "text": {
                "dark": "#2c3e50",
                "light": "#666666",
                "muted": "#999999"
            },
            "background": {
                "primary": "#ffffff",
                "secondary": "#f5f7fa"
            }
        },
        "typography": {
            "fontFamily": "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
            "fontSizes": {
                "h1": "28px",
                "h2": "20px",
                "h3": "18px",
                "body": "14px",
                "small": "12px"
            },
            "fontWeights": {
                "light": 300,
                "regular": 400,
                "semibold": 600,
                "bold": 700
            }
        },
        "spacing": {
            "xs": "4px",
            "sm": "8px",
            "md": "12px",
            "base": "16px",
            "lg": "20px",
            "xl": "24px",
            "2xl": "32px"
        },
        "borderRadius": {
            "sm": "4px",
            "md": "6px",
            "lg": "8px"
        },
        "shadows": {
            "sm": "0 1px 2px rgba(0, 0, 0, 0.05)",
            "md": "0 2px 8px rgba(0, 0, 0, 0.05)",
            "lg": "0 4px 12px rgba(0, 0, 0, 0.08)"
        }
    }
}
```

---

## SCSS Variables

```scss
// Colors
$primary: #1e5a9e;
$secondary: #f5f7fa;
$accent: #00a86b;
$success: #28a745;
$warning: #ffc107;
$danger: #dc3545;
$info: #17a2b8;

$text-dark: #2c3e50;
$text-light: #666666;
$text-muted: #999999;

$border-color: #ddd;
$background-color: #f5f7fa;
$white: #ffffff;

// Typography
$font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
$font-mono: 'Courier New', monospace;

$font-size-h1: 28px;
$font-size-h2: 20px;
$font-size-h3: 18px;
$font-size-body: 14px;
$font-size-small: 12px;

$font-weight-light: 300;
$font-weight-regular: 400;
$font-weight-semibold: 600;
$font-weight-bold: 700;

$line-height-heading: 1.2;
$line-height-body: 1.5;

// Spacing
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-base: 16px;
$spacing-lg: 20px;
$spacing-xl: 24px;
$spacing-2xl: 32px;

// Border Radius
$radius-sm: 4px;
$radius-md: 6px;
$radius-lg: 8px;

// Shadows
$shadow-md: 0 2px 8px rgba(0, 0, 0, 0.05);
$shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.08);

// Breakpoints
$breakpoint-tablet: 768px;
$breakpoint-desktop: 1200px;
```

---

## Usage Examples

### CSS

```css
.button-primary {
    background-color: var(--primary);
    color: var(--white);
    padding: var(--spacing-base) var(--spacing-lg);
    border-radius: var(--radius-md);
    transition: background-color var(--transition-base);
}

.button-primary:hover {
    background-color: var(--primary-hover);
}
```

### SCSS

```scss
.button-primary {
    background-color: $primary;
    color: $white;
    padding: $spacing-base $spacing-lg;
    border-radius: $radius-md;

    &:hover {
        background-color: darken($primary, 10%);
    }
}
```

---

**Version:** 1.0  
**Last Updated:** 28 April 2024
