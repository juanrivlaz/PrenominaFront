import { MenuCollapseInterface } from "@shared/interfaces/menu-collapse.interface";
import { MenuGroupInterface } from "@shared/interfaces/menu-group.interface";
import { MenuIntemInterface } from "@shared/interfaces/menu-item.interface";

export const ItemsNavigations: Array<MenuIntemInterface | MenuCollapseInterface | MenuGroupInterface> = [
    {
        id: 'tasistencia',
        title: 'Prenomina',
        type: 'item',
        exactMatch: true,
        icon: 'event_available',
        url: '/attendace'
    },
    {
        id: 'employeeadjustments',
        title: 'Ajuste Empleados',
        type: 'item',
        exactMatch: true,
        icon: 'manage_accounts',
        url: '/employee-adjustments'
    },
    {
        id: 'cargarchecadas',
        title: 'Cargar Checadas',
        type: 'item',
        exactMatch: true,
        icon: 'timer_arrow_up',
        url: '/import-attendance-logs'
    },
    {
        id: 'contratos',
        title: 'Contrato',
        type: 'item',
        exactMatch: true,
        icon: 'description',
        url: '/contracts'
    },
    {
        id: 'dlaborados',
        title: 'D. Laborados',
        type: 'item',
        exactMatch: true,
        icon: 'event_upcoming',
        url: '/worked-day-off'
    },
    {
        id: 'holidaydays',
        title: 'Días Festivos',
        type: 'item',
        exactMatch: true,
        icon: 'free_cancellation',
        url: '/holiday-days'
    },
    {
        id: 'pdom',
        title: 'P. Dominical',
        type: 'item',
        exactMatch: true,
        icon: 'currency_exchange',
        url: '/sunday-monday'
    },
    {
        id: 'permisos',
        title: 'Permisos',
        type: 'item',
        exactMatch: true,
        icon: 'workspace_premium',
        url: '/time-off-manager'
    },
    /*{
        id: 'retarods',
        title: 'Retardos',
        type: 'item',
        exactMatch: true,
        icon: 'history',
        url: '/retardos'
    },*/
    {
        id: 'settings',
        title: 'Configuración',
        type: 'item',
        exactMatch: true,
        icon: 'settings',
        url: '/settings'
    },
    {
        id: 'roles',
        title: 'Roles',
        type: 'item',
        exactMatch: true,
        icon: 'account_box',
        url: '/roles'
    },
    {
        id: 'pendingsattendanceincident',
        title: 'Incidencias Pendientes',
        type: 'item',
        exactMatch: true,
        icon: 'pending_actions',
        url: '/pendings-attendance-incident',
    },
    {
        id: 'users',
        title: 'Usuarios',
        type: 'item',
        exactMatch: true,
        icon: 'people',
        url: '/users'
    },
    {
        id: 'period',
        title: 'Periodos',
        type: 'item',
        exactMatch: true,
        icon: 'event_note',
        url: '/period'
    },
    {
        id: 'incidentcodesmanager',
        title: 'Códigos de Incidencias',
        type: 'item',
        exactMatch: true,
        icon: 'code',
        url: '/incident-codes-manager'
    },
    {
        id: 'clocks',
        title: 'Relojes',
        type: 'item',
        exactMatch: true,
        icon: 'history_toggle_off',
        url: '/clocks'
    },
    {
        id: 'documents',
        title: 'Documentos',
        type: 'item',
        exactMatch: true,
        icon: 'edit_document',
        url: '/documents'
    },
    {
        id: 'reports',
        title: 'Reportes',
        type: 'item',
        exactMatch: true,
        icon: 'assessment',
        url: '/reports'
    }
    /*{
        id: 'settings2',
        title: 'Settings2',
        type: 'collapse',
        icon: 'home',
        children: [
            {
                id: 'compute2',
                title: 'Compute2',
                type: 'item',
                exactMatch: true,
                url: '/compute2'
            },
        ],
    }*/
];