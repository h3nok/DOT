import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import {
  Form,
  FormField,
  FormSubmit,
  TagInput,
  Toggle,
  Checkbox,
  RadioGroup,
  NumberInput,
  DatePicker,
  FileUpload,
  RangeSlider,
  type RadioOption
} from '../components';

interface DemoFormData {
  textInput: string;
  toggle: boolean;
  checkbox: boolean;
  radio: string;
  number: number;
  date: string;
  range: number;
}

const FormComponentsDemo: React.FC = () => {
  const [tags, setTags] = useState<string[]>(['react', 'typescript']);
  const [files, setFiles] = useState<File[]>([]);

  const methods = useForm<DemoFormData>({
    defaultValues: {
      textInput: '',
      toggle: false,
      checkbox: false,
      radio: '',
      number: 0,
      date: '',
      range: 50,
    }
  });

  const { watch } = methods;
  const formValues = watch();

  const radioOptions: RadioOption[] = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ];

  const onSubmit = (data: DemoFormData) => {
    console.log('Form submitted:', data);
    alert('Form submitted! Check console for data.');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Form Components Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Showcase of DOT's reusable form components
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <FormProvider {...methods}>
          <Form form={methods} onSubmit={onSubmit} className="space-y-6">
            <FormField name="textInput" label="Text Input">
              {({ value, onChange, onBlur, name }) => (
                <input
                  type="text"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  name={name}
                  placeholder="Type something..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </FormField>

            <div>
              <Toggle
                id="demo-toggle"
                checked={formValues.toggle}
                onChange={(checked) => methods.setValue('toggle', checked)}
                label="Enable notifications"
              />
            </div>

            <div>
              <Checkbox
                checked={formValues.checkbox}
                onChange={(e) => methods.setValue('checkbox', e.target.checked)}
                label="I agree to the terms"
              />
            </div>

            <div>
              <RadioGroup
                value={formValues.radio}
                onChange={(value) => methods.setValue('radio', value)}
                options={radioOptions}
                name="sizeDemo"
              />
            </div>

            <div>
              <NumberInput
                value={formValues.number}
                onChange={(e) => methods.setValue('number', parseInt(e.target.value) || 0)}
                min={0}
                max={100}
                step={1}
                placeholder="Enter a number"
              />
            </div>

            <div>
              <DatePicker
                value={formValues.date}
                onChange={(e) => methods.setValue('date', e.target.value)}
                placeholder="Select a date"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Range Slider: {formValues.range}
              </label>
              <RangeSlider
                value={formValues.range}
                onChange={(value) => methods.setValue('range', value)}
                min={0}
                max={100}
                step={1}
                label="Adjust value"
              />
            </div>

            <FormSubmit>Submit Form</FormSubmit>
          </Form>
        </FormProvider>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Standalone Components</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tag Input
              </label>
              <TagInput
                value={tags}
                onChange={setTags}
                placeholder="Add tags..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                File Upload
              </label>
              <FileUpload
                onChange={(newFiles) => {
                  if (Array.isArray(newFiles)) {
                    setFiles(newFiles);
                  } else if (newFiles) {
                    setFiles([newFiles]);
                  } else {
                    setFiles([]);
                  }
                }}
                accept="image/*,.pdf,.doc,.docx"
                multiple
                maxSize={5 * 1024 * 1024}
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Current Values
          </h3>
          <div className="space-y-2 text-sm">
            <div><strong>Text:</strong> {formValues.textInput || '(empty)'}</div>
            <div><strong>Toggle:</strong> {formValues.toggle ? 'On' : 'Off'}</div>
            <div><strong>Checkbox:</strong> {formValues.checkbox ? 'Checked' : 'Unchecked'}</div>
            <div><strong>Radio:</strong> {formValues.radio || '(none selected)'}</div>
            <div><strong>Number:</strong> {formValues.number}</div>
            <div><strong>Date:</strong> {formValues.date || '(no date selected)'}</div>
            <div><strong>Range:</strong> {formValues.range}</div>
            <div><strong>Tags:</strong> {tags.join(', ') || '(none)'}</div>
            <div><strong>Files:</strong> {files.length > 0 ? `${files.length} file(s)` : '(no files)'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormComponentsDemo;
