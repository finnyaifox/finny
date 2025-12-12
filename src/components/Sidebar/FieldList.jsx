import { FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import FieldItem from './FieldItem';

export default function FieldList() {
    const { fields, filledFields } = useApp();

    const filledCount = Object.keys(filledFields).filter(k => filledFields[k]).length;

    return (
        <div className="sidebar-card fields-section">
            <div className="sidebar-card-header">
                <h3 className="sidebar-card-title">
                    <FileText />
                    Formularfelder ({filledCount}/{fields.length})
                </h3>
            </div>

            <div className="fields-list">
                {fields.length === 0 ? (
                    <div style={{
                        padding: 'var(--spacing-lg)',
                        textAlign: 'center',
                        color: 'var(--color-text-muted)',
                        fontSize: 'var(--font-size-sm)'
                    }}>
                        Noch keine Felder geladen
                    </div>
                ) : (
                    fields.map((field, index) => (
                        <FieldItem key={field.name} field={field} index={index} />
                    ))
                )}
            </div>

            {fields.length > 0 && (
                <div className="field-legend">
                    <div className="legend-item">
                        <div className="legend-dot filled" />
                        <span>Ausgefüllt</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-dot pending" />
                        <span>Offen</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-dot checkbox" />
                        <span>Checkbox</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-dot gender" />
                        <span>Geschlecht</span>
                    </div>
                </div>
            )}
        </div>
    );
}
