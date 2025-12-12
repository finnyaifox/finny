import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Check, Circle, Pencil, X, Check as CheckIcon, Trash2,
    Type, CheckSquare, Users, HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Detect field type from field name
function detectFieldType(fieldName) {
    const name = fieldName.toLowerCase();

    // Gender fields
    if (name.includes('geschlecht') || name.includes('gender') ||
        name.includes('männlich') || name.includes('weiblich') ||
        name.includes('divers') || name.includes('male') || name.includes('female')) {
        return 'gender';
    }

    // Checkbox fields
    if (name.includes('checkbox') || name.includes('ankreuz') ||
        name.includes('check') || name.includes('ja/nein') ||
        name.includes('ja_nein') || name.includes('zustimmung') ||
        name.includes('einverstanden') || name.includes('bestätigung')) {
        return 'checkbox';
    }

    return 'text';
}

export default function FieldItem({ field, index }) {
    const { filledFields, updateField } = useApp();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const value = filledFields[field.name] || '';
    const isFilled = !!value;
    const fieldType = detectFieldType(field.name);

    const handleEditClick = (e) => {
        e.stopPropagation();
        setEditValue(value);
        setIsEditing(true);
    };

    const handleSave = () => {
        updateField(field.name, editValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditValue('');
    };

    const handleDelete = () => {
        updateField(field.name, '');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const handleCheckboxChange = (selected) => {
        updateField(field.name, selected);
        setIsEditing(false);
    };

    const handleGenderChange = (gender) => {
        updateField(field.name, gender);
        setIsEditing(false);
    };

    const getFieldTypeIcon = () => {
        if (isFilled) return <Check />;

        switch (fieldType) {
            case 'checkbox':
                return <CheckSquare />;
            case 'gender':
                return <Users />;
            default:
                return <Type />;
        }
    };

    const getFieldItemClass = () => {
        let classes = 'field-item';
        if (isEditing) classes += ' editing';
        if (isFilled) classes += ' filled';
        else if (fieldType === 'checkbox') classes += ' checkbox';
        else if (fieldType === 'gender') classes += ' gender';
        else classes += ' pending';
        return classes;
    };

    const getTypeIconClass = () => {
        if (isFilled) return 'field-type-icon filled';
        return `field-type-icon ${fieldType}`;
    };

    return (
        <motion.div
            className={getFieldItemClass()}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            layout
        >
            <div className={getTypeIconClass()}>
                {getFieldTypeIcon()}
            </div>

            <div className="field-content">
                <div className="field-name">{field.name}</div>

                {isEditing ? (
                    <div className="field-edit-container">
                        {fieldType === 'checkbox' ? (
                            <div className="field-checkbox-options">
                                {['Ja', 'Nein'].map((option) => (
                                    <button
                                        key={option}
                                        className={`field-checkbox-option ${editValue === option ? 'selected' : ''}`}
                                        onClick={() => handleCheckboxChange(option)}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        ) : fieldType === 'gender' ? (
                            <div className="field-gender-options">
                                {['Männlich', 'Weiblich', 'Divers'].map((option) => (
                                    <button
                                        key={option}
                                        className={`field-gender-option ${editValue === option ? 'selected' : ''}`}
                                        onClick={() => handleGenderChange(option)}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <input
                                type="text"
                                className="field-edit-input"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                placeholder="Wert eingeben..."
                            />
                        )}
                    </div>
                ) : (
                    <div className={`field-value ${!value ? 'empty' : ''}`}>
                        {value ? (
                            <span>{value}</span>
                        ) : (
                            <>
                                <span>Noch nicht ausgefüllt</span>
                                <span className="field-type-badge">
                                    {fieldType === 'checkbox' ? '☑️ Checkbox' :
                                        fieldType === 'gender' ? '👤 Geschlecht' : '📝 Text'}
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="field-actions" style={{ opacity: isEditing ? 1 : undefined }}>
                {isEditing && fieldType === 'text' ? (
                    <>
                        <button
                            className="field-action-btn save"
                            onClick={handleSave}
                            title="Speichern"
                        >
                            <CheckIcon />
                        </button>
                        <button
                            className="field-action-btn cancel"
                            onClick={handleCancel}
                            title="Abbrechen"
                        >
                            <X />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className="field-action-btn edit"
                            onClick={handleEditClick}
                            title="Bearbeiten"
                        >
                            <Pencil />
                        </button>
                        {isFilled && (
                            <button
                                className="field-action-btn delete"
                                onClick={handleDelete}
                                title="Löschen"
                            >
                                <Trash2 />
                            </button>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
}
