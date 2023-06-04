const API_ROOT = '';
// const API_ROOT = 'https://webhook.site/2c78c4a9-5a7a-4ede-9488-0584c7214f08';

export function apiUrl(resource: string) {
    if (resource.startsWith('/')) {
        resource = resource.substring(1);
    }
    return API_ROOT + "/" + resource;
}
