/**
 * Schema definitions for each HACCP Log module form.
 * Each schema defines the fields to be rendered dynamically.
 */

// Common fields used across many forms
const commonFields = {
  date: { name: 'date', label: 'Date', type: 'date', required: true },
  time: { name: 'time', label: 'Time', type: 'time', required: true },
  completedBy: { name: 'completedBy', label: 'Completed By *', type: 'text', placeholder: 'Staff member name', required: true },
  notes: { name: 'notes', label: 'Notes / Observations', type: 'textarea', placeholder: 'Any additional notes...' },
  photoEvidence: { name: 'photoEvidence', label: 'Photo Evidence', type: 'photo' },
  checkPassed: { name: 'checkPassed', label: 'Check Passed?', type: 'toggle', subtitle: 'Does this meet the required standard?' },
  correctiveAction: { name: 'correctiveAction', label: 'Corrective Action Taken', type: 'textarea', placeholder: 'Describe action taken if check failed...' },
};

export const formSchemas = {
  'temperature-monitoring': {
    fields: [
      [commonFields.date, commonFields.time],
      { name: 'foodItem', label: 'Food Item / Product', type: 'text', placeholder: 'e.g. Chicken Breast', required: true },
      { name: 'storageLocation', label: 'Storage Location / Area', type: 'text', placeholder: 'e.g. Fridge 1, Dry Store' },
      { name: 'temperature', label: 'Temperature (°C)', type: 'number', placeholder: 'e.g. 4', required: true },
      { name: 'probeId', label: 'Probe / Thermometer ID', type: 'text', placeholder: 'e.g. PROBE-01' },
      commonFields.checkPassed,
      commonFields.correctiveAction,
      commonFields.completedBy,
      commonFields.notes,
      commonFields.photoEvidence,
    ],
  },
  'delivery-intake': {
    fields: [
      [commonFields.date, commonFields.time],
      { name: 'supplierName', label: 'Supplier Name', type: 'text', placeholder: 'e.g. Fresh Co. Meats', required: true },
      { name: 'foodItem', label: 'Food Item / Product', type: 'text', placeholder: 'e.g. Chicken Breast', required: true },
      { name: 'batchCode', label: 'Batch / Lot Code', type: 'text', placeholder: 'e.g. BC-20240601' },
      { name: 'useByDate', label: 'Use-By / Best-Before Date', type: 'date', placeholder: 'dd/mm/yyyy' },
      { name: 'quantity', label: 'Quantity / Weight', type: 'text', placeholder: 'e.g. 5kg' },
      { name: 'vehicleTemp', label: 'Delivery Vehicle Temp (°C)', type: 'number' },
      { name: 'temperature', label: 'Temperature (°C)', type: 'number', placeholder: 'e.g. 4' },
      { name: 'packagingIntact', label: 'Packaging Intact?', type: 'toggle' },
      { name: 'deliveryAccepted', label: 'Delivery Accepted?', type: 'toggle' },
      commonFields.correctiveAction,
      commonFields.completedBy,
      commonFields.notes,
      commonFields.photoEvidence,
    ],
  },
  'cooking-temperature': {
    fields: [
      [commonFields.date, commonFields.time],
      { name: 'foodItem', label: 'Food Item / Product', type: 'text', placeholder: 'e.g. Roast Beef', required: true },
      { name: 'temperature', label: 'Temperature (°C)', type: 'number', placeholder: 'e.g. 76', required: true },
      { name: 'targetRange', label: 'Target Range', type: 'text', placeholder: 'e.g. ≥75°C' },
      { name: 'probeId', label: 'Probe / Thermometer ID', type: 'text', placeholder: 'e.g. PROBE-02' },
      commonFields.checkPassed,
      commonFields.correctiveAction,
      commonFields.completedBy,
      commonFields.notes,
      commonFields.photoEvidence,
    ],
  },
  'blast-chilling': {
    fields: [
      [commonFields.date, commonFields.time],
      { name: 'foodItem', label: 'Food Item / Product', type: 'text', placeholder: 'e.g. Soup', required: true },
      { name: 'startTemperature', label: 'Temperature (°C)', type: 'number', placeholder: 'e.g. 65', required: true },
      { name: 'endTemperature', label: 'End Temperature (°C)', type: 'number', placeholder: 'e.g. 3', required: true },
      { name: 'duration', label: 'Duration (minutes)', type: 'number', placeholder: 'e.g. 90', required: true },
      { name: 'probeId', label: 'Probe / Thermometer ID', type: 'text', placeholder: 'e.g. PROBE-01' },
      commonFields.checkPassed,
      commonFields.correctiveAction,
      commonFields.completedBy,
      commonFields.notes,
      commonFields.photoEvidence,
    ],
  },
  'hot-holding': {
    fields: [
      [commonFields.date, commonFields.time],
      { name: 'foodItem', label: 'Food Item / Product', type: 'text', placeholder: 'e.g. Curry', required: true },
      { name: 'temperature', label: 'Temperature (°C)', type: 'number', placeholder: 'e.g. 65', required: true },
      { name: 'storageLocation', label: 'Storage Location / Area', type: 'text', placeholder: 'e.g. Bain Marie 1' },
      { name: 'probeId', label: 'Probe / Thermometer ID', type: 'text', placeholder: 'e.g. PROBE-03' },
      commonFields.checkPassed,
      commonFields.correctiveAction,
      commonFields.completedBy,
      commonFields.notes,
      commonFields.photoEvidence,
    ],
  },
  'cooling-process': {
    fields: [
      [commonFields.date, commonFields.time],
      { name: 'foodItem', label: 'Food Item / Product', type: 'text', placeholder: 'e.g. Rice', required: true },
      { name: 'startTemperature', label: 'Temperature (°C)', type: 'number', placeholder: 'e.g. 60', required: true },
      { name: 'endTemperature', label: 'End Temperature (°C)', type: 'number', placeholder: 'e.g. 5', required: true },
      { name: 'duration', label: 'Duration (minutes)', type: 'number', placeholder: 'e.g. 110', required: true },
      commonFields.checkPassed,
      commonFields.correctiveAction,
      commonFields.completedBy,
      commonFields.notes,
      commonFields.photoEvidence,
    ],
  },
  'thawing': {
    fields: [
      [commonFields.date, commonFields.time],
      { name: 'foodItem', label: 'Food Item / Product', type: 'text', placeholder: 'e.g. Frozen Prawns', required: true },
      { name: 'temperature', label: 'Temperature (°C)', type: 'number', placeholder: 'e.g. 2' },
      { name: 'duration', label: 'Duration (minutes)', type: 'number', placeholder: 'e.g. 720' },
      { name: 'storageLocation', label: 'Storage Location / Area', type: 'text', placeholder: 'e.g. Prep Fridge' },
      commonFields.checkPassed,
      commonFields.completedBy,
      commonFields.notes,
    ],
  },
  'cleaning': {
    fields: [
      [commonFields.date, commonFields.time],
      { name: 'foodItem', label: 'Food Item / Product', type: 'text', placeholder: 'Optional item reference' },
      {
        name: 'storageLocation', label: 'Storage Location / Area', type: 'select', placeholder: 'Select cleaning area',
        options: [
          { value: 'Kitchen Prep Area', label: 'Kitchen Prep Area' },
          { value: 'Dishwash Area', label: 'Dishwash Area' },
          { value: 'Cold Store', label: 'Cold Store' },
          { value: 'Dry Store', label: 'Dry Store' },
          { value: 'Front of House', label: 'Front of House' },
          { value: 'Bins / Waste Area', label: 'Bins / Waste Area' },
        ]
      },
      commonFields.checkPassed,
      commonFields.completedBy,
      commonFields.notes,
      commonFields.photoEvidence,
    ],
  },
  'personal-hygiene': {
    fields: [
      [commonFields.date, commonFields.time],
      commonFields.completedBy,
      commonFields.checkPassed,
      commonFields.notes,
    ],
  },
  'probe-calibration': {
    fields: [
      [commonFields.date, commonFields.time],
      { name: 'probeId', label: 'Probe / Thermometer ID', type: 'text', placeholder: 'e.g. PROBE-01', required: true },
      { name: 'startTemperature', label: 'Temperature (°C)', type: 'number', placeholder: 'e.g. 0' },
      { name: 'endTemperature', label: 'End Temperature (°C)', type: 'number', placeholder: 'e.g. 100' },
      commonFields.checkPassed,
      commonFields.correctiveAction,
      commonFields.completedBy,
      commonFields.notes,
    ],
  },
  'oil-fryer': {
    fields: [
      [commonFields.date, commonFields.time],
      { name: 'temperature', label: 'Temperature (°C)', type: 'number', placeholder: 'e.g. 170', required: true },
      {
        name: 'oilQuality', label: 'Oil Quality', type: 'select',
        options: [
          { value: 'Acceptable (light, clear)', label: 'Acceptable (light, clear)' },
          { value: 'Moderate (slightly dark)', label: 'Moderate (slightly dark)' },
          { value: 'Unacceptable (dark, acrid)', label: 'Unacceptable (dark, acrid)' },
        ]
      },
      { name: 'storageLocation', label: 'Storage Location / Area', type: 'text', placeholder: 'e.g. Fryer Station 1' },
      commonFields.checkPassed,
      commonFields.correctiveAction,
      commonFields.completedBy,
      commonFields.notes,
    ],
  },
  'corrective-actions': {
    fields: [
      [commonFields.date, commonFields.time],
      { name: 'foodItem', label: 'Food Item / Product', type: 'text', placeholder: 'e.g. Chicken' },
      { name: 'temperature', label: 'Temperature (°C)', type: 'number', placeholder: 'e.g. 10' },
      commonFields.correctiveAction,
      commonFields.completedBy,
      commonFields.notes,
      commonFields.photoEvidence,
    ],
  },
  'pest-control': {
    fields: [
      [commonFields.date, commonFields.time],
      { name: 'storageLocation', label: 'Storage Location / Area', type: 'text', placeholder: 'e.g. Dry Store' },
      commonFields.checkPassed,
      commonFields.correctiveAction,
      commonFields.completedBy,
      commonFields.notes,
      commonFields.photoEvidence,
    ],
  },
};
