// third party deps
import { merge as m } from 'ramda';
import * as clone from 'clone';

// same-module deps
import { DiagPacket } from 'diagnostic-tools/shared';

export const NAMESPACE = 'diag';
const _getState = (store: any): DiagState => store[NAMESPACE];

export interface PacketTreeNode { // @todo: or PacketFrame?
  packet: DiagPacket | null;
  children: Array<PacketTreeNode>
}

export const ACTIVE_TAB = 'ACTIVE'; // this is the only non-import tab

export interface PresentationOptions {
  showPassed: boolean;
};

export interface Import {
  name: string;
  packets: Array<DiagPacket>;
  packetTree: PacketTreeNode;
}

export interface DiagState {
  packets: Array<DiagPacket>; // @todo: get rid of this one?
  packetTree: PacketTreeNode;
  imports: Array<Import>;
  currentView: string;
  presentationOptions: PresentationOptions;
}

export const INITIAL_STATE: DiagState = {
  packets: [],
  packetTree: { packet: null, children:[] },
  imports: [],
  currentView: ACTIVE_TAB,
  presentationOptions: {
    showPassed: true
  }
};

export class Selectors {
  static packets
    = (store) => _getState(store).packets
  static packetTree
    = (store) => _getState(store).packetTree
  static presentationOptions
    = (store) => _getState(store).presentationOptions
  static imports
    = (store) => _getState(store).imports
  static currentView
    = (store) => _getState(store).currentView
}

export class Updaters {

  static addPacket
    = (packet: DiagPacket, state: DiagState): DiagState => {
      debugger
      return m(state, {
        packets: state.packets
          .concat(packet)
          .sort((a, b) => a.diagnostic.timestamp - b.diagnostic.timestamp),
        packetTree: insertPacketIntoTree(packet, state.packetTree) })
    }

  static clearEverything
    = (): DiagState => INITIAL_STATE

  static clearActive
    = (state: DiagState): DiagState => m(state, {
      packets: INITIAL_STATE.packets,
      packetTree: INITIAL_STATE.packetTree })

  static clearImports
    = (state: DiagState): DiagState => m(state, {
      imports: INITIAL_STATE.imports,
      currentView: INITIAL_STATE.currentView })

  static setShowPassed
    = (showPassed: Boolean, state: DiagState): DiagState =>
      m(state, {
        presentationOptions: m(state.presentationOptions, { showPassed }) })

  static addImport
    = (packets: Array<DiagPacket>, state: DiagState): DiagState => {
      const newName = `Import ${state.imports.length + 1}`;
      return m(state, {
        imports: state.imports.concat([{
            name: newName,
            packets,
            packetTree: buildPacketTree(packets) }]),
        currentView: newName }) }

  static selectTab
    = (name: string, state: DiagState): DiagState =>
      m(state, {
        currentView: name })

}

const newFrame = (packet = null): PacketTreeNode => ({ //@todo: types types types
  children: [],
  packet,
});

const buildPacketTree = (packets: Array<DiagPacket>):PacketTreeNode =>
  packets.reduce((tree:PacketTreeNode, packet:DiagPacket) => insertPacketIntoTree(packet, tree), null);

// TODO: rewrite, make this not so mutaty (dont use foreach) code looks like hell
// TODO: language is messy, frame and node used interchangeably
const insertPacketIntoTree = (packet: DiagPacket, tree: PacketTreeNode): PacketTreeNode => {
  const treeClone = clone(tree || newFrame()); // TODO: this seems really inefficient, cloning the entire tree every time, why????
  let frameCursor = treeClone;
  packet.diagnostic.logicalThread.stackTreePosition.forEach(i => {
    const arrOfNewLength = (new Array(Math.max(i + 1, frameCursor.children.length))).fill(true).map(_ => newFrame());
    frameCursor.children.forEach((_, j) => arrOfNewLength[j] = frameCursor.children[j]);
    frameCursor.children = arrOfNewLength;
    frameCursor = frameCursor.children[i];
  });
  // @todo: rewrite into nicer way of inserting new frame when we reach the correct spot
  frameCursor.packet = packet;
  return treeClone;
};
