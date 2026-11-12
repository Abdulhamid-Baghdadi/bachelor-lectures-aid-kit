// The list, the binary search tree and the hash against the book's own worked examples (Klima and Selberherr 2010,
// ch. 19), each named by its figure or table and printed page.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../../src/core/index.js";

const letters = list => C.listOrder(list).map(k => list.nodes[k].element).join("");

test("list: Fig. 19.4 keeps L I S T E in an array, head 0, links 1 2 3 4 −1 (p. 268)", () => {
  const l = C.listFrom("LISTE");
  assert.equal(l.head, 0);
  assert.deepEqual(l.nodes.map(n => n.next), [1, 2, 3, 4, -1]);
  assert.equal(letters(l), "LISTE");
});

test("list: the four assignments of p. 269 reorder Fig. 19.4 into S T E I L (Fig. 19.3, p. 267)", () => {
  const l = C.listFrom("LISTE");
  l.nodes[4].next = 1; l.nodes[1].next = 0; l.nodes[0].next = -1; l.head = 2;
  assert.equal(letters(l), "STEIL");
});

test("list: inserting E after the first node turns L I S T E into L E I S T E (Fig. 19.6, p. 270)", () => {
  const r = C.listInsert(C.listFrom("LISTE"), "E", 1);
  assert.equal(letters(r.list), "LEISTE");
  assert.deepEqual(r.links, [[5, 1], [0, 5]]);
});

test("list: ListeEinfuegen(feld, &kopf, 5, 3) puts N into array cell 5, after the third node (pp. 270–271)", () => {
  const r = C.listInsert(C.listFrom("LISTE"), "N", 3);
  assert.equal(r.node, 5);
  assert.equal(letters(r.list), "LISNTE");
  assert.equal(letters(C.listInsert(C.listFrom("LISTE"), "N", 0).list), "NLISTE", "position 0: the head");
  assert.equal(letters(C.listInsert(C.listFrom("LISTE"), "N", 9).list), "LISTEN", "past the length: the end");
  assert.equal(letters(C.listInsert(C.listFrom(""), "N", 4).list), "N", "an empty list");
});

test("list: removing T from L E I S T E gives L E I S E, the node marked −2 (Fig. 19.7 and p. 272)", () => {
  const r = C.listRemove(C.listInsert(C.listFrom("LISTE"), "E", 1).list, "T");
  assert.equal(r.found, 1);
  assert.equal(letters(r.list), "LEISE");
  assert.equal(r.list.nodes[r.removed].next, -2);
  assert.equal(C.listRemove(r.list, "Q").found, 0, "not found: 0");
  assert.equal(letters(C.listRemove(C.listFrom("LISTE"), "L").list), "ISTE", "the first node: the head moves on");
  assert.equal(letters(C.listRemove(C.listFrom("LISTE"), "E").list), "LIST", "of several equal elements the first goes (p. 271)");
});

// Fig. 19.14 (p. 278), read back from the three orders the book gives for it on p. 282.
const fig14 = { root: 0, nodes: [
  { key: "S", left: 1, right: 2 }, { key: "B", left: 3, right: 4 }, { key: "E", left: 5, right: 6 },
  { key: "I", left: 7, right: 8 }, { key: "E", left: -1, right: 9 }, { key: "P", left: -1, right: 10 },
  { key: "L", left: -1, right: -1 }, { key: "E", left: -1, right: -1 }, { key: "N", left: -1, right: -1 },
  { key: "I", left: -1, right: -1 }, { key: "I", left: -1, right: -1 }] };
const keys = (t, order) => C.traverse(t, order).map(i => t.nodes[i].key).join("");

test("tree: preorder, inorder and postorder of Fig. 19.14 as the book lists them (p. 282)", () => {
  assert.equal(keys(fig14, "pre"), "SBIENEIEPIL");
  assert.equal(keys(fig14, "in"), "EINBEISPIEL");
  assert.equal(keys(fig14, "post"), "ENIIEBIPLES");
  assert.equal(keys(fig14, "level"), "SBEIEPLENII");
});

test("tree: inserting E I N B E I S P I E L gives Fig. 19.18 (Fig. 19.21, pp. 283–285), equal keys to the left", () => {
  const t = C.bstFrom([..."EINBEISPIEL"]);
  assert.equal(C.treeText(t), "E(B(-,E(E,-)),I(I(I,-),N(L,S(P,-))))");
  assert.equal(keys(t, "in"), "BEEEIIILNPS", "inorder gives the keys sorted (p. 282)");
  assert.equal(C.height(t), 5);
});

test("tree: searching N in Fig. 19.18 goes right at E, right at I and finds N (p. 283)", () => {
  const t = C.bstFrom([..."EINBEISPIEL"]);
  const r = C.bstSearch(t, "N");
  assert.deepEqual(r.path.map(i => t.nodes[i].key), ["E", "I", "N"]);
  assert.equal(C.bstSearch(t, "A").found, -1);
});

test("tree: deleting M from Fig. 19.22 puts P in its place and R where P was (Fig. 19.23, p. 286)", () => {
  const t = C.bstFrom([..."MDTAFSXPZR"]);
  assert.equal(C.treeText(t), "M(D(A,F),T(S(P(-,R),-),X(-,Z)))", "Fig. 19.22");
  const r = C.bstDelete(t, "M");
  assert.equal(C.treeText(r.tree), "P(D(A,F),T(S(R,-),X(-,Z)))");
  assert.equal(C.treeText(C.bstDelete(t, "S").tree), "M(D(A,F),T(P(-,R),X(-,Z)))", "no right successor: the left one moves up");
  assert.equal(C.treeText(C.bstDelete(t, "T").tree), "M(D(A,F),X(S(P(-,R),-),Z))", "the right successor has no left one: it is taken itself");
  assert.equal(C.bstDelete(t, "Q").found, false);
});

test("tree: a complete tree of 11 nodes has 4 levels (Fig. 19.16, p. 280); keys inserted sorted make a chain", () => {
  assert.equal(C.completeHeight(11), 4);
  assert.equal(C.height(C.bstFrom([..."ABCDEFG"])), 7);
  assert.equal(C.height(C.bstFrom([..."DBFACEG"])), 3);
});

test("hash: Wald, Wiese, Dorf, Bach and Holz go to 5, 2, 5, 8 and 5 in a hash of length 11 (Table 19.2, p. 299)", () => {
  assert.deepEqual(["Wald", "Wiese", "Dorf", "Bach", "Holz"].map(w => C.hashIndex(w, 11).index), [5, 2, 5, 8, 5]);
});

test("hash: Fig. 19.34(f) chains Holz, Dorf, Wald at 5; searches cost 5/11 ≈ 0.45 and 1.6 comparisons (pp. 299–300)", () => {
  const t = ["Wald", "Wiese", "Dorf", "Bach", "Holz"].reduce((h, w) => C.hashInsert(h, w).table, C.emptyHash(11));
  assert.deepEqual(t[5], ["Holz", "Dorf", "Wald"]);
  const c = C.hashCosts(t);
  assert.equal(c.unsuccessful, 5 / 11);
  assert.equal(c.successful, 1.6);
  assert.deepEqual(C.hashSearch(t, "Wald"), { index: 5, found: true, comparisons: 3 });
});
