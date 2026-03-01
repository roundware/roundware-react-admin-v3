export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface ILanguage {
    id: number;
    name: string;
    language_code: string;
}


export interface LocalizedString {

    id?: number;
    language?: string;
    language_code?: string;
    text: string;
    language_id: number;

}