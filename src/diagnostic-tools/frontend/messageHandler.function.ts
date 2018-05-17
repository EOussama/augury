//same-module deps
import { DiagService } from './service'
import { Message, MessageType } from '../module-dependencies.barrel'

export const createFrontendDiagnosticsMessageHandler = (diagService: DiagService) => {
  return (message: Message<any>, respond?: () => void) => {
    switch (message.messageType) {
      case MessageType.Initialize:
        diagService.clear();
        break;
      case MessageType.DiagnosticPacket:
        diagService.takePacket(message.content);
        respond && respond();
        break;
      case MessageType.DiagnosticEvent:
        diagService.takePacket(message.content);
        respond && respond();
        break;
    }
  }
}
