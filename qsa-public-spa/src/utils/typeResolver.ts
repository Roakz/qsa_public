const PathMappingForType: { [name: string]: string } = {
  agent_corporate_entity: '/agencies/',
  resource: '/series/',
  archival_object: '/items/',
  mandate: '/mandates/',
  function: '/functions/'
};

const LabelForType: { [name: string]: string } = {
  agent_corporate_entity: 'Agency',
  resource: 'Series',
  archival_object: 'Item',
  mandate: 'Mandate',
  function: 'Function',
  physical_representation: 'Physical representation',
  digital_representation: 'Digital representation',
};

const IconForType: { [name: string]: string } = {
  agent_corporate_entity: 'fa fa-building',
  resource: 'fa fa-folder-open',
  archival_object: 'fa fa-file',
  mandate: 'fa fa-legal',
  function: 'fa fa-clipboard'
};

const ErrorForCode: { [name: string]: string } = {
  REQUIRED_VALUE_MISSING: "Can't be blank",
  CONFIRM_PASSWORD_MISMATCH: 'Must match Confirm Password',
  INCORRECT_PASSWORD: 'Incorrect Password',
  UNIQUE_CONSTRAINT: 'Must be unique',
  SLUG_IN_USE: 'Slug already in use',
};

export const uriFor = (qsaIDPrefixed: string, recordType: string): string => {
  return PathMappingForType[recordType] + qsaIDPrefixed;
};

export const labelForType = (recordType: string): string => {
  return LabelForType[recordType];
};

export const iconForType = (recordType: string): string => {
  return IconForType[recordType];
};

const LabelForAvailability: { [name: string]: string } = {
    available: 'There are no other restrictions current.',
    unavailable_temporarily: 'Temporarily Unavailable. Contact QSA for more information.',
    unavailable_due_to_conservation: 'This item must be assessed by a conservator to determine if it can be made available.',
    unavailable_due_to_condition: 'This item is unavailable due to its condition. Where possible, a copy will be made available.',
    unavailable_due_to_format:  'This item is unavailable due to its format. Where possible, a copy will be made available.',
    unavailable_due_to_deaccession: 'This item is unavailable because it has been deaccessioned or destroyed.',
    unavailable_due_to_date_range: 'As the date range of this item is uncertain, contact QSA to confirm availability.',
    unavailable_contact_qsa: 'Availability needs to be determined by an archivist. Contact QSA for more information.',
};

export const labelForAvailability = (availability: string): string => {
  return LabelForAvailability[availability];
};

export const uppercaseInitials = (str: string): string => {
  return str
    .split(' ')
    .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
};

export const snakeToUppercaseInitials = (s: string): string => {
  return s
    .split('_')
    .map(uppercaseInitials)
    .join(' ')
    .replace("Is", "");
};

export const labelForRelator = (relator: string): string => {
  return snakeToUppercaseInitials(relator);
};

export const labelForMandateType = (type: string): string => {
  return uppercaseInitials(type);
};

export const errorMessageForCode = (code: string): string => {
  return ErrorForCode[code] || code;
};
