import ProgressBar from './ProgressBar';
import FieldList from './FieldList';
import './Sidebar.css';

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <ProgressBar />
            <FieldList />
        </aside>
    );
}
