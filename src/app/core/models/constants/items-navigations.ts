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
        id: 'reports',
        title: 'Reportes',
        type: 'item',
        exactMatch: true,
        icon: 'assessment',
        url: '/reports'
    },
    {
        id: 'employeeadjustments',
        title: 'Ajuste Empleados',
        type: 'item',
        exactMatch: true,
        icon: 'manage_accounts',
        url: '/employee-adjustments',
        isItemConfig: true,
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
        url: '/holiday-days',
        isItemConfig: true,
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
        url: '/roles',
        isItemConfig: true,
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
        url: '/users',
        isItemConfig: true,
    },
    {
        id: 'period',
        title: 'Periodos',
        type: 'item',
        exactMatch: true,
        icon: 'event_note',
        url: '/period',
        isItemConfig: true,
    },
    {
        id: 'incidentcodesmanager',
        title: 'Códigos de Incidencias',
        type: 'item',
        exactMatch: true,
        icon: 'code',
        url: '/incident-codes-manager',
        isItemConfig: true,
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
        id: 'additionalpay',
        title: 'Pago Adicional',
        type: 'item',
        exactMatch: true,
        icon: 'attach_money',
        url: '/additional-pay'
    },
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