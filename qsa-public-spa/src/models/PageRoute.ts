import { RouteComponentProps } from 'react-router-dom';
import { IAppContext } from '../context/AppContext';
import {RecordDisplay} from "./RecordDisplay";

export interface PageRoute extends RouteComponentProps<any> {
    context: IAppContext;
    setPageTitle: (title: string) => void;
    triggerPageViewTracker: (path?: string) => void;
    triggerDownloadTracker: (path: string, repesentation: RecordDisplay) => void;
}
