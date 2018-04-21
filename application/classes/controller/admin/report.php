<?php
class Controller_Admin_Report extends Controller_Admin
{
    public function action_index()
    {
        $allFiles = Constructor_Dao_File::get_by_name('');
        $this->view->set('allFiles', $allFiles);
        $selectedIds = Constructor_Dao_File::getReportFiles(Constructor_Dao_File::ROOT_USER_ID);
        $this->view->set('selectedIds', $selectedIds);
        $reportData = Constructor_Dao_File::getReportData(Constructor_Dao_File::ROOT_USER_ID);
        $this->view->set('reportData', $reportData);
        $this->tpl = 'admin/report';
    }
    
    public function action_saveData()
    {
        $selected = $this->p('selectedFiles');
        Constructor_Dao_File::setReportFiles(Constructor_Dao_File::ROOT_USER_ID, $selected);
        $textDesc = $this->p('textDesc');
        Constructor_Dao_File::setReportData(Constructor_Dao_File::ROOT_USER_ID, $textDesc);
        $this->request->redirect('/admin/report/');
    }
}