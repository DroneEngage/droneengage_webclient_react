// Builds initial values for form fields from the template
// Recursively processes nested objects and sets default values for text, number, checkbox, combo, and array types
export function buildInitialValues(template) {
  const res = {};
  for (const fieldName in template) {
    let fieldConfig = template[fieldName];
    if (typeof fieldConfig === 'object' && fieldConfig.type === undefined) {
      fieldConfig = { type: 'object', fields: fieldConfig };
    }
    if (fieldConfig.type === 'object') {
      res[fieldName] = buildInitialValues(fieldConfig.fields);
    } else if (fieldConfig.type === 'array') {
      res[fieldName] = fieldConfig.defaultvalue ? [...fieldConfig.defaultvalue] : [];
    } else {
      res[fieldName] = fieldConfig.defaultvalue;
    }
  }
  return res;
}

// Builds initial enabled states for optional fields
// Sets optional fields to false and recursively processes nested objects
export function buildInitialEnabled(template, path = '', res = {}) {
  for (const fieldName in template) {
    let fieldConfig = template[fieldName];
    if (typeof fieldConfig === 'object' && fieldConfig.type === undefined) {
      fieldConfig = { type: 'object', fields: fieldConfig };
    }
    const fullPath = path ? `${path}.${fieldName}` : fieldName;
    if (fieldConfig.optional) {
      res[fullPath] = false;
    }
    if (fieldConfig.type === 'object') {
      buildInitialEnabled(fieldConfig.fields, fullPath, res);
    }
    if (fieldConfig.type === 'array') {
      const defaultArray = fieldConfig.defaultvalue || [];
      for (let i = 0; i < defaultArray.length; i++) {
        buildInitialEnabled(fieldConfig.array_template, `${fullPath}.${i}`, res);
      }
    }
  }
  return res;
}

// Constructs the JSON output by processing the template, values, and enabled states
// Handles different field types and skips disabled optional fields
export function buildOutput(template, values, enabled, path = '') {
  const res = {};
  for (const fieldName in template) {
    let fieldConfig = template[fieldName];
    if (fieldConfig == null) continue;
    if (typeof fieldConfig === 'object' && fieldConfig.type === undefined) {
      fieldConfig = { type: 'object', fields: fieldConfig };
    }
    const fullPath = path ? `${path}.${fieldName}` : fieldName;
    if (fieldConfig.optional && !(enabled[fullPath] ?? true)) continue;
    const v_fieldName = fieldConfig.fieldName || fieldName;
    if (fieldConfig.type === 'object') {
      const subValues = values?.[fieldName] || {};
      const subOutput = buildOutput(fieldConfig.fields, subValues, enabled, fullPath);
      if (Object.keys(subOutput).length > 0) {
        res[v_fieldName] = subOutput;
      }
    } else if (fieldConfig.type === 'array') {
      const arrayValues = values?.[fieldName] || [];
      const filteredArray = arrayValues.map((item, index) => {
        const itemPath = `${fullPath}.${index}`;
        const itemEnabled = enabled[itemPath] ?? true;
        if (!itemEnabled && fieldConfig.optional) return null;
        return buildOutput(fieldConfig.array_template, item, enabled, itemPath);
      }).filter(item => item !== null);
      if (filteredArray.length > 0) {
        res[v_fieldName] = filteredArray;
      }
    } else if (fieldConfig.type === 'checkbox') {
      res[v_fieldName] = values?.[fieldName];
    } else if (fieldConfig.type === 'number') {
      res[v_fieldName] = Number(values?.[fieldName]);
    } else {
      res[v_fieldName] = values?.[fieldName];
    }
  }
  return res;
}

// Retrieves a value from a nested object using a dot-separated path
// Returns undefined if the path is invalid
export function getNested(obj, pathStr) {
  const pathArr = pathStr.split('.');
  let current = obj;
  for (let key of pathArr) {
    if (current == null) return undefined;
    key = isNaN(key) ? key : parseInt(key);
    current = current[key];
  }
  return current;
}

// Updates a nested value in an object using a dot-separated path
// Returns a new object with the updated value
export function updateValue(values, pathStr, newVal) {
  const pathArr = pathStr.split('.');
  const newValues = JSON.parse(JSON.stringify(values));
  let current = newValues;
  for (let i = 0; i < pathArr.length - 1; i++) {
    let key = pathArr[i];
    key = isNaN(key) ? key : parseInt(key);
    if (current[key] == null) current[key] = isNaN(pathArr[i + 1]) ? {} : [];
    current = current[key];
  }
  let lastKey = pathArr[pathArr.length - 1];
  lastKey = isNaN(lastKey) ? lastKey : parseInt(lastKey);
  current[lastKey] = newVal;
  return newValues;
}

// Updates the enabled state for an optional field
// Returns a new object with the updated enabled state
export function updateEnable(enabled, pathStr, checked) {
  return { ...enabled, [pathStr]: checked };
}

// Sets a nested value in an object using a dot-separated path
// Returns the modified object (mutates the original)
export function setNested(obj, pathStr, value) {
  const pathArr = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    let key = pathArr[i];
    key = isNaN(key) ? key : parseInt(key);
    if (current[key] == null) current[key] = isNaN(pathArr[i + 1]) ? {} : [];
    current = current[key];
  }
  let lastKey = pathArr[pathArr.length - 1];
  lastKey = isNaN(lastKey) ? lastKey : parseInt(lastKey);
  current[lastKey] = value;
  return obj;
}

// Copies text to the clipboard and displays a confirmation alert
export function handleCopy(text) {
  navigator.clipboard.writeText(text);
  alert('JSON copied to clipboard!');
}

// Saves text as a downloadable file with the specified filename
// Alerts if no filename is provided
export function handleSave(text, fileName) {
  if (!fileName) {
    alert('Please enter a filename.');
    return;
  }
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}