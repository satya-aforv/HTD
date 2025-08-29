import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';

interface ReportTemplate {
  _id: string;
  name: string;
  type: string;
  description: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Recipient {
  user: string;
  email: string;
  deliveryMethod: string;
}

interface ScheduleConfig {
  frequency: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: {
    hour: number;
    minute: number;
  };
  timezone: string;
}

interface ScheduledReportFormProps {
  report?: ScheduledReport;
  onClose: () => void;
  onSave: (reportData: CreateScheduledReportData) => void;
}

interface ScheduledReport {
  _id: string;
  name: string;
  description: string;
  template: {
    _id: string;
    name: string;
    type: string;
  };
  schedule: ScheduleConfig;
  recipients: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    email: string;
    deliveryMethod: string;
  }>;
  format: string;
  retentionDays: number;
  parameters: Record<string, unknown>;
}

interface CreateScheduledReportData {
  name: string;
  description?: string;
  templateId: string;
  schedule: ScheduleConfig;
  recipients: Recipient[];
  format: string;
  parameters?: Record<string, unknown>;
  retentionDays?: number;
}

const ScheduledReportForm: React.FC<ScheduledReportFormProps> = ({ report, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    templateId: '',
    format: 'PDF',
    retentionDays: 30,
  });

  const [schedule, setSchedule] = useState<ScheduleConfig>({
    frequency: 'DAILY',
    time: { hour: 9, minute: 0 },
    timezone: 'UTC'
  });

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [parameters, setParameters] = useState<Record<string, unknown>>({});

  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [scheduleOptions, setScheduleOptions] = useState<{
    frequencies?: Array<{ value: string; label: string; description: string }>;
    daysOfWeek?: Array<{ value: number; label: string }>;
    deliveryMethods?: Array<{ value: string; label: string; description: string }>;
    formats?: Array<{ value: string; label: string; description: string }>;
  }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchUsers();
    fetchScheduleOptions();

    if (report) {
      populateForm(report);
    }
  }, [report]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/report-templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchScheduleOptions = async () => {
    try {
      const response = await fetch('/api/scheduled-reports/options', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setScheduleOptions(data.data);
      }
    } catch (error) {
      console.error('Error fetching schedule options:', error);
    }
  };

  const populateForm = (reportData: ScheduledReport) => {
    setFormData({
      name: reportData.name,
      description: reportData.description || '',
      templateId: reportData.template._id,
      format: reportData.format,
      retentionDays: reportData.retentionDays
    });

    setSchedule(reportData.schedule);
    setRecipients(reportData.recipients.map((r) => ({
      user: r.user._id,
      email: r.email,
      deliveryMethod: r.deliveryMethod
    })));
    setParameters(reportData.parameters || {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (recipients.length === 0) {
      alert('At least one recipient is required');
      return;
    }

    setLoading(true);

    const reportData = {
      ...formData,
      schedule,
      recipients,
      parameters
    };

    try {
      await onSave(reportData);
      onClose();
    } catch (error) {
      console.error('Error saving scheduled report:', error);
      alert('Failed to save scheduled report');
    } finally {
      setLoading(false);
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, { user: '', email: '', deliveryMethod: 'EMAIL' }]);
  };

  const updateRecipient = (index: number, field: keyof Recipient, value: string) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill email when user is selected
    if (field === 'user' && value) {
      const selectedUser = users.find(u => u._id === value);
      if (selectedUser) {
        updated[index].email = selectedUser.email;
      }
    }
    
    setRecipients(updated);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const renderScheduleFields = () => {
    const { frequency } = schedule;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            {scheduleOptions.frequencies?.map((freq) => (
              <option key={freq.value} value={freq.value}>
                {freq.label} - {freq.description}
              </option>
            ))}
          </select>
        </div>

        {frequency === 'WEEKLY' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Day of Week
            </label>
            <select
              value={schedule.dayOfWeek || 0}
              onChange={(e) => setSchedule({ ...schedule, dayOfWeek: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {scheduleOptions.daysOfWeek?.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {frequency === 'MONTHLY' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Day of Month
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={schedule.dayOfMonth || 1}
              onChange={(e) => setSchedule({ ...schedule, dayOfMonth: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hour (24h format)
            </label>
            <input
              type="number"
              min="0"
              max="23"
              value={schedule.time.hour}
              onChange={(e) => setSchedule({
                ...schedule,
                time: { ...schedule.time, hour: parseInt(e.target.value) }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minute
            </label>
            <input
              type="number"
              min="0"
              max="59"
              value={schedule.time.minute}
              onChange={(e) => setSchedule({
                ...schedule,
                time: { ...schedule.time, minute: parseInt(e.target.value) }
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {report ? 'Edit Scheduled Report' : 'Create Scheduled Report'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Monthly Candidate Report"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template *
              </label>
              <select
                required
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select Template</option>
                {templates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name} ({template.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Optional description of the report"
            />
          </div>

          {/* Schedule Configuration */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Configuration</h3>
            {renderScheduleFields()}
          </div>

          {/* Recipients */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recipients</h3>
              <button
                type="button"
                onClick={addRecipient}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center space-x-1"
              >
                <FiPlus className="w-4 h-4" />
                <span>Add Recipient</span>
              </button>
            </div>

            <div className="space-y-3">
              {recipients.map((recipient, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <select
                      value={recipient.user}
                      onChange={(e) => updateRecipient(index, 'user', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="email"
                      value={recipient.email}
                      onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                      placeholder="Email address"
                      className="w-full border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div className="flex-1">
                    <select
                      value={recipient.deliveryMethod}
                      onChange={(e) => updateRecipient(index, 'deliveryMethod', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1"
                    >
                      {scheduleOptions.deliveryMethods?.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRecipient(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Output Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Format
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {scheduleOptions.formats?.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label} - {format.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retention Days
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.retentionDays}
                onChange={(e) => setFormData({ ...formData, retentionDays: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (report ? 'Update Report' : 'Create Report')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduledReportForm;
