const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mapping = {
    // Buttons
    'base/Button': 'buttons/Button',
    
    // Inputs
    'base/Input': 'inputs/Input',
    'forms/CompactInput': 'inputs/CompactInput',
    'forms/SearchInput': 'inputs/SearchInput',
    'base/Textarea': 'inputs/Textarea',
    'forms/FormTextarea': 'inputs/FormTextarea',
    'forms/FormInput': 'inputs/FormInput',
    'forms/DatePicker': 'inputs/DatePicker',
    
    // Selection
    'base/Checkbox': 'selection/Checkbox',
    'base/Radio': 'selection/Radio',
    'forms/Toggle': 'selection/Toggle',
    'forms/CompactSwitch': 'selection/CompactSwitch',
    'forms/Select': 'selection/Select',
    'forms/PortalSelect': 'selection/PortalSelect',
    'forms/SearchableSelect': 'selection/SearchableSelect',
    'forms/SearchableSelectHeadless': 'selection/SearchableSelectHeadless',
    'forms/SearchableMultiSelect': 'selection/SearchableMultiSelect',
    'forms/TreeSelect': 'selection/TreeSelect',
    'overlays/DropdownMenu': 'selection/DropdownMenu',
    'data/FilterPopover': 'selection/FilterPopover',
    'data/SimpleFilters': 'selection/SimpleFilters',

    // Navigation
    'navigation/LayoutToggle': 'navigation/LayoutToggle',
    'navigation/NavigationMenu': 'navigation/NavigationMenu',
    'navigation/Tabs': 'navigation/Tabs',
    'navigation/Breadcrumb': 'navigation/Breadcrumb',
    'navigation/Sidebar': 'navigation/Sidebar',
    'base/TextLink': 'navigation/TextLink',

    // Dialogs
    'overlays/Modal': 'dialogs/Modal',
    'overlays/Dialog': 'dialogs/Dialog',
    'overlays/ConfirmationModal': 'dialogs/ConfirmationModal',
    'overlays/Sheet': 'dialogs/Sheet',
    'overlays/Popover': 'dialogs/Popover',

    // Feedback
    'overlays/Tooltip': 'feedback/Tooltip',
    'feedback/Toast': 'feedback/Toast',
    'feedback/Alert': 'feedback/Alert',
    'feedback/EmptyState': 'feedback/EmptyState',
    'base/Skeleton': 'feedback/Skeleton',
    'feedback/ContractSkeleton': 'feedback/ContractSkeleton',
    'feedback/LoadingLottie': 'feedback/LoadingLottie',
    'base/Badge': 'feedback/Badge',
    'data/StatusBadge': 'feedback/StatusBadge',

    // Tables
    'data/DataTable': 'tables/DataTable',
    'data/ExcelActions': 'tables/ExcelActions',

    // Cards
    'base/Card': 'cards/Card',

    // Forms
    'base/Label': 'forms/Label',
    'base/InputError': 'forms/InputError',

    // Uploads
    'forms/FileUpload': 'uploads/FileUpload',

    // User
    'data/Avatar': 'user/Avatar',

    // Utilities
    'base/Icon': 'utilities/Icon',
    'base/Heading': 'utilities/Heading',
    'base/ScrollArea': 'utilities/ScrollArea',
    'base/Separator': 'utilities/Separator',
    'base/Collapsible': 'utilities/Collapsible',
    'data/Highlighter': 'utilities/Highlighter'
};

const uiDir = path.join(__dirname, 'resources', 'js', 'components', 'ui');

// Ensure target directories exist
const newDirs = new Set(Object.values(mapping).map(v => path.dirname(path.join(uiDir, v))));
newDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Move files
for (const [oldPath, newPath] of Object.entries(mapping)) {
    const oldFile = path.join(uiDir, oldPath + '.tsx');
    const newFile = path.join(uiDir, newPath + '.tsx');
    
    if (fs.existsSync(oldFile)) {
        fs.renameSync(oldFile, newFile);
        console.log(`Moved ${oldPath}.tsx to ${newPath}.tsx`);
    } else {
        console.log(`Warning: ${oldFile} does not exist`);
    }
}

// Function to replace strings in all TS/TSX files
function replaceInFiles() {
    const files = execSync('find resources/js -type f -name "*.ts" -o -name "*.tsx"').toString().trim().split('\n');
    
    for (const file of files) {
        if (!file) continue;
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        for (const [oldPath, newPath] of Object.entries(mapping)) {
            // Looking for imports like '@/components/ui/oldPath'
            // We use global regex replacement
            const oldImport = `@/components/ui/${oldPath}`;
            const newImport = `@/components/ui/${newPath}`;
            
            // Also handle relative imports if any exist, but typically they use alias
            if (content.includes(oldImport)) {
                content = content.replaceAll(oldImport, newImport);
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Updated imports in ${file}`);
        }
    }
}

replaceInFiles();

// Remove old empty directories
const oldDirs = ['base', 'data', 'feedback', 'forms', 'navigation', 'overlays'];
for (const dir of oldDirs) {
    const dirPath = path.join(uiDir, dir);
    if (fs.existsSync(dirPath)) {
        try {
            const files = fs.readdirSync(dirPath);
            if (files.length === 0) {
                fs.rmdirSync(dirPath);
                console.log(`Removed empty directory ${dir}`);
            } else {
                console.log(`Directory ${dir} not empty, skipping removal`);
            }
        } catch (e) {
            console.log(`Error removing ${dir}: ${e.message}`);
        }
    }
}
