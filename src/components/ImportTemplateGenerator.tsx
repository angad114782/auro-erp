import React from 'react';
import { FileDown, FileSpreadsheet, FileX } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { toast } from 'sonner@2.0.3';

interface ImportTemplateGeneratorProps {
  moduleType?: 'RedSeal' | 'GreenSeal' | 'POTarget';
}

export function ImportTemplateGenerator({ moduleType = 'RedSeal' }: ImportTemplateGeneratorProps) {
  const generateExcelTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      
      // Sample data with all required columns
      const templateData = [
        {
          'Project Code': 'RD240001',
          'Brand': 'Nike',
          'Brand Code': 'NK',
          'Category': 'Sports Shoes',
          'Type': 'Running',
          'Color': 'Black',
          'Country': 'India',
          'Status': 'Prototype',
          'Progress': '50%',
          'Target Cost (₹)': '15,000',
          'Final Cost (₹)': '',
          'Variance (₹)': '',
          'Start Date': '2024-01-01',
          'End Date': '2024-02-01',
          'Duration (Days)': '31',
          'Client Feedback': 'OK',
          'PO Target': '2024-02-15',
          'PO Received': '',
          'Remarks': 'Sample project for import template',
          'Created Date': '2024-01-01',
          'Last Updated': '2024-01-01'
        },
        {
          'Project Code': 'RD240002',
          'Brand': 'Adidas',
          'Brand Code': 'AD',
          'Category': 'Casual Shoes',
          'Type': 'Lifestyle',
          'Color': 'White',
          'Country': 'China',
          'Status': 'Red Seal',
          'Progress': '62%',
          'Target Cost (₹)': '12,000',
          'Final Cost (₹)': '11,500',
          'Variance (₹)': '-500',
          'Start Date': '2024-01-05',
          'End Date': '2024-02-05',
          'Duration (Days)': '31',
          'Client Feedback': 'Update Required',
          'PO Target': '2024-02-20',
          'PO Received': '',
          'Remarks': 'Another sample project',
          'Created Date': '2024-01-05',
          'Last Updated': '2024-01-15'
        }
      ];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 12 }, // Project Code
        { wch: 15 }, // Brand
        { wch: 10 }, // Brand Code
        { wch: 15 }, // Category
        { wch: 12 }, // Type
        { wch: 10 }, // Color
        { wch: 12 }, // Country
        { wch: 15 }, // Status
        { wch: 10 }, // Progress
        { wch: 15 }, // Target Cost
        { wch: 15 }, // Final Cost
        { wch: 12 }, // Variance
        { wch: 12 }, // Start Date
        { wch: 12 }, // End Date
        { wch: 12 }, // Duration
        { wch: 15 }, // Client Feedback
        { wch: 12 }, // PO Target
        { wch: 12 }, // PO Received
        { wch: 30 }, // Remarks
        { wch: 12 }, // Created Date
        { wch: 12 }  // Last Updated
      ];
      ws['!cols'] = colWidths;

      // Add instructions sheet
      const instructionData = [
        { 'IMPORT INSTRUCTIONS': 'Please read these instructions carefully before importing data:' },
        { 'IMPORT INSTRUCTIONS': '' },
        { 'IMPORT INSTRUCTIONS': '1. Required Fields (must be filled):' },
        { 'IMPORT INSTRUCTIONS': '   - Project Code: Unique identifier for each project' },
        { 'IMPORT INSTRUCTIONS': '   - Brand: Brand name (must exist in master data)' },
        { 'IMPORT INSTRUCTIONS': '   - Category: Product category (must exist in master data)' },
        { 'IMPORT INSTRUCTIONS': '   - Type: Product type (must exist in master data)' },
        { 'IMPORT INSTRUCTIONS': '   - Color: Color name (must exist in master data)' },
        { 'IMPORT INSTRUCTIONS': '   - Country: Country of origin (must exist in master data)' },
        { 'IMPORT INSTRUCTIONS': '   - Status: Project status (valid values below)' },
        { 'IMPORT INSTRUCTIONS': '   - Target Cost (₹): Target cost in Indian Rupees' },
        { 'IMPORT INSTRUCTIONS': '' },
        { 'IMPORT INSTRUCTIONS': '2. Valid Status Values:' },
        { 'IMPORT INSTRUCTIONS': '   - Idea Submitted' },
        { 'IMPORT INSTRUCTIONS': '   - Costing Pending' },
        { 'IMPORT INSTRUCTIONS': '   - Costing Received' },
        { 'IMPORT INSTRUCTIONS': '   - Prototype' },
        { 'IMPORT INSTRUCTIONS': '   - Red Seal' },
        { 'IMPORT INSTRUCTIONS': '   - Green Seal' },
        { 'IMPORT INSTRUCTIONS': '   - Final Approved' },
        { 'IMPORT INSTRUCTIONS': '   - PO Issued' },
        { 'IMPORT INSTRUCTIONS': '' },
        { 'IMPORT INSTRUCTIONS': '3. Date Format: YYYY-MM-DD or DD/MM/YYYY' },
        { 'IMPORT INSTRUCTIONS': '4. Currency Format: Numbers only or with ₹ symbol' },
        { 'IMPORT INSTRUCTIONS': '5. Existing projects with same code will be skipped' },
        { 'IMPORT INSTRUCTIONS': '6. If master data (Brand, Category, etc.) doesn\'t exist, default values will be used' },
        { 'IMPORT INSTRUCTIONS': '' },
        { 'IMPORT INSTRUCTIONS': 'DELETE THIS INSTRUCTIONS SHEET BEFORE IMPORTING!' }
      ];

      const instructionWs = XLSX.utils.json_to_sheet(instructionData);
      instructionWs['!cols'] = [{ wch: 80 }];

      // Add sheets to workbook
      XLSX.utils.book_append_sheet(wb, instructionWs, 'INSTRUCTIONS');
      XLSX.utils.book_append_sheet(wb, ws, 'Projects_Template');
      
      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${moduleType}_Import_Template_${timestamp}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, filename);
      
      toast.success('Excel import template downloaded successfully!');
    } catch (error) {
      console.error('Template generation error:', error);
      toast.error('Failed to generate Excel template');
    }
  };

  const generateXMLTemplate = () => {
    try {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<${moduleType}Import>
  <ImportInfo>
    <Instructions>
      <![CDATA[
      IMPORT INSTRUCTIONS:
      
      1. Required Fields:
         - ProjectCode: Unique identifier
         - Brand/Name: Brand name
         - Category: Product category
         - Type: Product type
         - Color: Color name
         - Country: Country of origin
         - Status: Project status (see valid values below)
         - TargetCost: Target cost in Indian Rupees
      
      2. Valid Status Values:
         - Idea Submitted
         - Costing Pending
         - Costing Received
         - Prototype
         - Red Seal
         - Green Seal
         - Final Approved
         - PO Issued
      
      3. Date Format: ISO 8601 (YYYY-MM-DDTHH:MM:SS.sssZ) or YYYY-MM-DD
      4. Existing projects with same code will be skipped
      
      DELETE THIS ImportInfo SECTION BEFORE IMPORTING!
      ]]>
    </Instructions>
  </ImportInfo>
  <Projects>
    <Project>
      <SerialNumber>1</SerialNumber>
      <ProjectCode>RD240001</ProjectCode>
      <Brand>
        <Name>Nike</Name>
        <Code>NK</Code>
      </Brand>
      <Category>Sports Shoes</Category>
      <Type>Running</Type>
      <Color>Black</Color>
      <Country>India</Country>
      <Status>Prototype</Status>
      <Progress>50%</Progress>
      <Financial>
        <TargetCost currency="INR">15000</TargetCost>
        <FinalCost currency="INR">0</FinalCost>
        <Variance currency="INR">0</Variance>
      </Financial>
      <Timeline>
        <StartDate>2024-01-01</StartDate>
        <EndDate>2024-02-01</EndDate>
        <Duration>31</Duration>
      </Timeline>
      <ClientFeedback>OK</ClientFeedback>
      <PurchaseOrder>
        <TargetDate>2024-02-15</TargetDate>
        <ReceivedDate></ReceivedDate>
      </PurchaseOrder>
      <Remarks><![CDATA[Sample project for import template]]></Remarks>
      <Metadata>
        <CreatedDate>2024-01-01T00:00:00.000Z</CreatedDate>
        <UpdatedDate>2024-01-01T00:00:00.000Z</UpdatedDate>
      </Metadata>
    </Project>
    <Project>
      <SerialNumber>2</SerialNumber>
      <ProjectCode>RD240002</ProjectCode>
      <Brand>
        <Name>Adidas</Name>
        <Code>AD</Code>
      </Brand>
      <Category>Casual Shoes</Category>
      <Type>Lifestyle</Type>
      <Color>White</Color>
      <Country>China</Country>
      <Status>Red Seal</Status>
      <Progress>62%</Progress>
      <Financial>
        <TargetCost currency="INR">12000</TargetCost>
        <FinalCost currency="INR">11500</FinalCost>
        <Variance currency="INR">-500</Variance>
      </Financial>
      <Timeline>
        <StartDate>2024-01-05</StartDate>
        <EndDate>2024-02-05</EndDate>
        <Duration>31</Duration>
      </Timeline>
      <ClientFeedback>Update Required</ClientFeedback>
      <PurchaseOrder>
        <TargetDate>2024-02-20</TargetDate>
        <ReceivedDate></ReceivedDate>
      </PurchaseOrder>
      <Remarks><![CDATA[Another sample project]]></Remarks>
      <Metadata>
        <CreatedDate>2024-01-05T00:00:00.000Z</CreatedDate>
        <UpdatedDate>2024-01-15T00:00:00.000Z</UpdatedDate>
      </Metadata>
    </Project>
  </Projects>
</${moduleType}Import>`;

      // Create and download file
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `${moduleType}_Import_Template_${timestamp}.xml`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('XML import template downloaded successfully!');
    } catch (error) {
      console.error('XML Template generation error:', error);
      toast.error('Failed to generate XML template');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <FileDown className="w-4 h-4 mr-2" />
          Template
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={generateExcelTemplate}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
          Download Excel Template
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={generateXMLTemplate}
          className="cursor-pointer"
        >
          <FileX className="w-4 h-4 mr-2 text-blue-600" />
          Download XML Template
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}