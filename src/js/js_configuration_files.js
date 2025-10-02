

export function loadConfigurationFiles(p_file_path) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/configuration_files/${p_file_path}`, false); // Synchronous request
    xhr.send(null);

    if (xhr.status === 200) {
        try
        {
        const jsonString = xhr.responseText;
        return JSON.parse(jsonString);
        }
        catch
        {
            return {};        
        }
    }

    return {};

}