// The data structures of Klima and Selberherr (2010), ch. 19: the linked list kept in an array (§ 19.2), the binary
// search tree (§ 19.4) and the hash with separate chaining (§ 19.6). Each follows the book's own description, cited by
// section and printed page, and returns new values without changing its input, so a lab can show before and after.

/** A list kept in an array as in Fig. 19.4 (p. 268): node k holds an element and the index of the next node, −1 ends
 *  the list, and the head is the index of the first node. Built from a string, node k is its k-th letter. */
export function listFrom(text) {
  const nodes = [...text].map((element, k) => ({ element, next: k + 1 < text.length ? k + 1 : -1 }));
  return { nodes, head: nodes.length ? 0 : -1 };
}

/** The indices of the nodes in list order, following the links from the head (AusgabeListe, pp. 268–269). */
export function listOrder({ nodes, head }) {
  const order = [];
  for (let k = head; k !== -1 && order.length <= nodes.length; k = nodes[k].next) order.push(k);
  return order;
}

/** ListeEinfuegen (pp. 270–271): the new element goes into the next free array cell; position 0 puts it at the head,
 *  otherwise it goes after the position-th node, and a position at or past the length puts it at the end. Returns the
 *  new list, the new node's index, the nodes walked and the links set, as [node, new next]. */
export function listInsert(list, element, position) {
  const nodes = list.nodes.map(n => ({ ...n })), k = nodes.length;
  nodes.push({ element, next: -1 });
  let head = list.head;
  const walked = [], links = [];
  if (head === -1 || position === 0) {
    nodes[k].next = head; links.push([k, head]);
    head = k; links.push(["head", k]);
  } else {
    let node = head; walked.push(node);
    for (; nodes[node].next !== -1 && position > 1; position--) { node = nodes[node].next; walked.push(node); }
    nodes[k].next = nodes[node].next; links.push([k, nodes[k].next]);
    nodes[node].next = k; links.push([node, k]);
  }
  return { list: { nodes, head }, node: k, walked, links };
}

/** ListeEntfernen (p. 272): the first node holding the element is taken out of the chain by pointing its predecessor
 *  (or the head) at its successor; a node taken out further down is marked −2. found: 1 when removed, 0 when not. */
export function listRemove(list, element) {
  const nodes = list.nodes.map(n => ({ ...n }));
  let head = list.head;
  const walked = [], links = [];
  let found = 0, removed = -1;
  if (head !== -1) {
    walked.push(head);
    if (nodes[head].element === element) {
      removed = head; head = nodes[head].next; links.push(["head", head]); found = 1;
    } else {
      let node = head, next = nodes[node].next;
      while (next !== -1) {
        walked.push(next);
        if (nodes[next].element === element) {
          nodes[node].next = nodes[next].next; links.push([node, nodes[node].next]);
          nodes[next].next = -2; links.push([next, -2]);
          removed = next; found = 1; break;
        }
        node = next; next = nodes[node].next;
      }
    }
  }
  return { list: { nodes, head }, found, removed, walked, links };
}

/** A binary search tree (§ 19.4.3, p. 280): every key in a node's left subtree is smaller, every key in its right
 *  subtree larger; equal keys go left, the book's own convention. Nodes in an array, −1 for "no successor". */
export const emptyTree = () => ({ nodes: [], root: -1 });

/** Insertion (§ 19.4.4.3, p. 283): search "unsuccessfully" down to a free link and hang the key there. Returns the
 *  new tree, the path of nodes compared and the new node's index. */
export function bstInsert(tree, key) {
  const nodes = tree.nodes.map(n => n && { ...n }), k = nodes.length, path = [];
  nodes.push({ key, left: -1, right: -1 });
  if (tree.root === -1) return { tree: { nodes, root: k }, path, node: k };
  let i = tree.root;
  for (;;) {
    path.push(i);
    const side = key <= nodes[i].key ? "left" : "right";
    if (nodes[i][side] === -1) { nodes[i][side] = k; break; }
    i = nodes[i][side];
  }
  return { tree: { nodes, root: tree.root }, path, node: k };
}

/** A tree built by inserting the keys in the order given, as Fig. 19.21 does (pp. 283–285). */
export const bstFrom = keys => keys.reduce((t, key) => bstInsert(t, key).tree, emptyTree());

/** Search (§ 19.4.4.2, pp. 282–283): smaller goes left, larger right, equal is found; the first equal key wins. */
export function bstSearch({ nodes, root }, key) {
  const path = [];
  for (let i = root; i !== -1;) {
    path.push(i);
    if (key < nodes[i].key) i = nodes[i].left;
    else if (key > nodes[i].key) i = nodes[i].right;
    else return { path, found: i };
  }
  return { path, found: -1 };
}

/** The four orders the book names (§ 19.4.4.1, pp. 281–282): level order row by row from the left; preorder node,
 *  left, right; inorder left, node, right; postorder left, right, node. Returns node indices. */
export function traverse({ nodes, root }, order) {
  const out = [];
  if (order === "level") {
    for (let q = root === -1 ? [] : [root]; q.length;) {
      const i = q.shift(); out.push(i);
      for (const c of [nodes[i].left, nodes[i].right]) if (c !== -1) q.push(c);
    }
    return out;
  }
  const walk = i => {
    if (i === -1) return;
    if (order === "pre") out.push(i);
    walk(nodes[i].left);
    if (order === "in") out.push(i);
    walk(nodes[i].right);
    if (order === "post") out.push(i);
  };
  walk(root);
  return out;
}

/** The depth of each node, the root at 1, and the tree's height: the number of levels (p. 279). */
export function depths({ nodes, root }) {
  const d = new Array(nodes.length).fill(0);
  const walk = (i, k) => { if (i === -1) return; d[i] = k; walk(nodes[i].left, k + 1); walk(nodes[i].right, k + 1); };
  walk(root, 1);
  return d;
}
export const height = tree => Math.max(0, ...depths(tree));

/** The height of a complete binary tree of N nodes: the whole part of log₂(N) + 1 (p. 280). */
export const completeHeight = n => n < 1 ? 0 : Math.floor(Math.log2(n)) + 1;

/** Deletion (§ 19.4.4.4, pp. 283–286): without a right successor the node is replaced by its left one; otherwise by
 *  the smallest node of its right subtree (the next larger key), whose own right successor moves up into its place.
 *  Returns the new tree, whether the key was found and the replacement node (−1 when there is none). */
export function bstDelete(tree, key) {
  const { found } = bstSearch(tree, key);
  if (found === -1) return { tree, found: false, replacement: -1 };
  const nodes = tree.nodes.map(n => n && { ...n }); // a deleted node stays null
  let root = tree.root;
  const parentOf = i => nodes.findIndex(n => n && (n.left === i || n.right === i));
  const relink = (p, from, to) => { if (p === -1) root = to; else if (nodes[p].left === from) nodes[p].left = to; else nodes[p].right = to; };
  const p = parentOf(found);
  let replacement;
  if (nodes[found].right === -1) {
    replacement = nodes[found].left;
  } else {
    replacement = nodes[found].right;
    while (nodes[replacement].left !== -1) replacement = nodes[replacement].left;
    if (replacement !== nodes[found].right) {
      relink(parentOf(replacement), replacement, nodes[replacement].right);
      nodes[replacement].right = nodes[found].right;
    }
    nodes[replacement].left = nodes[found].left;
  }
  relink(p, found, replacement);
  nodes[found] = null; // taken out; indices of the others stay as they are
  return { tree: { nodes, root }, found: true, replacement };
}

/** A tree as nested text, key(left,right), "-" for no successor: compact for tests and readouts. */
export function treeText({ nodes, root }) {
  const t = i => {
    if (i === -1) return "-";
    const n = nodes[i];
    return n.left === -1 && n.right === -1 ? String(n.key) : `${n.key}(${t(n.left)},${t(n.right)})`;
  };
  return t(root);
}

/** The hash function for strings (§ 19.6.1, p. 297): over at most the first 20 characters, index = (64 · index +
 *  code) % N. Exact in any length; the book's faster form (p. 298) takes the modulo only at the end and gives the same
 *  index as long as its unsigned long does not overflow. Returns the index and each step's value. */
export function hashIndex(text, n) {
  const steps = [];
  let index = 0;
  for (const ch of [...text].slice(0, 20)) { index = (64 * index + ch.codePointAt(0)) % n; steps.push(index); }
  return { index, steps };
}

/** An empty hash of length N: an array of empty lists (Fig. 19.34(a), p. 299). */
export const emptyHash = n => Array.from({ length: n }, () => []);

/** Separate chaining (§ 19.6.2, pp. 298–299): the record goes at the head of the list its index names. */
export function hashInsert(table, text) {
  const { index } = hashIndex(text, table.length);
  return { table: table.map((list, i) => i === index ? [text, ...list] : list), index };
}

/** Search: compute the index, then look along that list. comparisons counts the records looked at. */
export function hashSearch(table, text) {
  const { index } = hashIndex(text, table.length), at = table[index].indexOf(text);
  return { index, found: at !== -1, comparisons: at === -1 ? table[index].length : at + 1 };
}

/** Mean comparisons (pp. 299–300): an unsuccessful search looks through a whole list, so the sum of list lengths over
 *  N; a successful one stops at the record, so the sum of the records' places in their lists over the M records. */
export function hashCosts(table) {
  const m = table.reduce((s, l) => s + l.length, 0);
  const places = table.reduce((s, l) => s + l.reduce((t, _, k) => t + k + 1, 0), 0);
  return { m, n: table.length, unsuccessful: m / table.length, successful: m ? places / m : 0 };
}
