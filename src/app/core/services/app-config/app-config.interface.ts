export interface Layout {
    navigation: 'right' | 'left' | 'top' | 'none';
    navigationFolded: boolean;
    toolbar: 'above' | 'below' | 'none';
    footer: 'above' | 'below' | 'none';
    mode: 'fullwidth' | 'boxed';
}

export interface AppConfigInterface {
    layout: Layout;
    logo: string;
    primaryColor: string;
    secondColor: string;
    loading: boolean;
}