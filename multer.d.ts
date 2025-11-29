// Это гарантирует, что типы Multer будут доступны глобально
// для использования в аннотации 'Express.Multer.File'
import * as multer from 'multer';

declare global {
  namespace Express {
    namespace Multer {
      interface File extends multer.File {}
    }
  }
}