/**
 * ==================================
 * eLISAschool - Extension types Express pour Validation Workflow
 * ==================================
 */

import { WorkflowValidation } from '@modules/validation-workflow/entities';

declare global {
    namespace Express {
        interface Request {
            workflow?: WorkflowValidation;
        }
    }
}
