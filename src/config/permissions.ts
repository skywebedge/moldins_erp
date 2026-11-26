export type UserRole =
  | 'OWNER'
  | 'ACCOUNTANT'
  | 'FACTORY_MANAGER'
  | 'STORE_KEEPER'
  | 'DISPATCH_OPERATOR'
  | 'SITE_MANAGER'
  | 'SITE_SUPERVISOR';

export interface RolePermissions {
  canAccessFactory: boolean;
  canAccessSite: boolean;
  canManageProduction: boolean;
  canManageStock: boolean;
  canManageChallan: boolean;
  canManageSales: boolean;
  canManageSiteEntry: boolean;
  canManagePayments: boolean;
  canApprovePayments: boolean;
  canViewReports: boolean;
  canEditRecipe: boolean;         
  canDeleteMoney: boolean;        
  canManageUsers: boolean;        
  canViewMoneyControl: boolean;   
  isRestrictedToAssignedSites: boolean; 
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  OWNER: {
    canAccessFactory: true,
    canAccessSite: true,
    canManageProduction: true,
    canManageStock: true,
    canManageChallan: true,
    canManageSales: true,
    canManageSiteEntry: true,
    canManagePayments: true,
    canApprovePayments: true,
    canViewReports: true,
    canEditRecipe: true,
    canDeleteMoney: true,
    canManageUsers: true,
    canViewMoneyControl: true,
    isRestrictedToAssignedSites: false,
  },
  ACCOUNTANT: {
    canAccessFactory: true,
    canAccessSite: true,
    canManageProduction: false,
    canManageStock: false,
    canManageChallan: true,
    canManageSales: true,
    canManageSiteEntry: false,
    canManagePayments: true,
    canApprovePayments: false,
    canViewReports: true,
    canEditRecipe: false,
    canDeleteMoney: false,
    canManageUsers: false,
    canViewMoneyControl: false,
    isRestrictedToAssignedSites: false,
  },
  FACTORY_MANAGER: {
    canAccessFactory: true,
    canAccessSite: false,
    canManageProduction: true,
    canManageStock: true,
    canManageChallan: false,
    canManageSales: false,
    canManageSiteEntry: false,
    canManagePayments: false,
    canApprovePayments: false,
    canViewReports: true,
    canEditRecipe: false,
    canDeleteMoney: false,
    canManageUsers: false,
    canViewMoneyControl: false,
    isRestrictedToAssignedSites: false,
  },
  STORE_KEEPER: {
    canAccessFactory: true,
    canAccessSite: false,
    canManageProduction: false,
    canManageStock: true,
    canManageChallan: false,
    canManageSales: false,
    canManageSiteEntry: false,
    canManagePayments: false,
    canApprovePayments: false,
    canViewReports: false,
    canEditRecipe: false,
    canDeleteMoney: false,
    canManageUsers: false,
    canViewMoneyControl: false,
    isRestrictedToAssignedSites: false,
  },
  DISPATCH_OPERATOR: {
    canAccessFactory: true,
    canAccessSite: false,
    canManageProduction: false,
    canManageStock: false,
    canManageChallan: true,
    canManageSales: false,
    canManageSiteEntry: false,
    canManagePayments: false,
    canApprovePayments: false,
    canViewReports: false,
    canEditRecipe: false,
    canDeleteMoney: false,
    canManageUsers: false,
    canViewMoneyControl: false,
    isRestrictedToAssignedSites: false,
  },
  SITE_MANAGER: {
    canAccessFactory: false,
    canAccessSite: true,
    canManageProduction: false,
    canManageStock: false,
    canManageChallan: false,
    canManageSales: false,
    canManageSiteEntry: true,
    canManagePayments: true,
    canApprovePayments: true,
    canViewReports: true,
    canEditRecipe: false,
    canDeleteMoney: false,
    canManageUsers: false,
    canViewMoneyControl: false,
    isRestrictedToAssignedSites: false,
  },
  SITE_SUPERVISOR: {
    canAccessFactory: false,
    canAccessSite: true,
    canManageProduction: false,
    canManageStock: false,
    canManageChallan: false,
    canManageSales: false,
    canManageSiteEntry: true,
    canManagePayments: false,
    canApprovePayments: false,
    canViewReports: false,
    canEditRecipe: false,
    canDeleteMoney: false,
    canManageUsers: false,
    canViewMoneyControl: false,
    isRestrictedToAssignedSites: true,
  },
};

export const ROLE_LABELS: Record<UserRole, { hi: string; en: string }> = {
  OWNER: { hi: 'Owner', en: 'Owner' },
  ACCOUNTANT: { hi: 'Accountant', en: 'Accountant' },
  FACTORY_MANAGER: { hi: 'Factory Manager', en: 'Factory Manager' },
  STORE_KEEPER: { hi: 'Store Keeper', en: 'Store Keeper' },
  DISPATCH_OPERATOR: { hi: 'Dispatch Operator', en: 'Dispatch Operator' },
  SITE_MANAGER: { hi: 'Manager (Site)', en: 'Manager (Site)' },
  SITE_SUPERVISOR: { hi: 'Site Supervisor', en: 'Site Supervisor' },
};
