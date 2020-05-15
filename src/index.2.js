
/**
 * react实现的并发模式是通过requestIdleCallback这个浏览器AIP实现，类似与setTimeout，不过不是我们告诉浏览器什么时候执行回调函数，而是浏览器在线程空闲（idle）的时侯主动执行回调函数。
 * React 目前已经不用这个 API了，而是自己实现调度算法 调度器/scheduler。但它们核心思路是类似的，简化起见用 requestIdleCallback 足矣。
 * 请关注45--56行代码
 * 任务的拆分是通过performUnitOfWork函数实现的，具体的拆分方式通过fiber实现（fiber是深度遍历优先算法实现的）
 * react设计了fiber的数据结构，每个元素都是一个fiber，每个fiber就是一个单元任务（fiber请自行百度学习理解）
 * 在 render 函数我们创建根 fiber，再把它设为 nextUnitOfWork。在 workLoop 函数把 nextUnitOfWork 给 performUnitOfWork 执行，主要包含以下三步：
 * 1. 把元素添加到 DOM
 * 2. 为元素的后代创建 fiber 节点
 * 3. 选择下一个单元任务，并返回
 */

/**
 * fiber会形成链式结构将每一个fiber链接起来（每个 fiber 直接链接它的第一个子节点(child)，子节点链接它的兄弟节点(sibling)，兄弟节点链接到父节点(parent)）
 * 举例 element = <div><h1><p /><a /></h1><h2 /></div>,请查看public文件夹下的fiber图片
 * 当我们完成了一个 fiber 的单元任务，如果他有一个 子节点/child 则这个节点作为 nextUnitOfWork。请查看public文件夹下的fiber-child图片
 * 如果一个 fiber 没有 child，我们用 兄弟节点/sibling 作为下一个任务单元。请查看public文件夹下的fiber-subling图片
 * 如果一个 fiber 既没有 child 也没有 sibling，则找到父节点的兄弟节点。请查看public文件夹下的fiber-parent图片
 * 如果父节点没有兄弟节点，则继续往上找，直到找到一个兄弟节点或者到达 fiber 根结点。到达根结点即意味本次 render 任务全部完成
 */
const createElement = (type, props, ...children) => {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => typeof child === 'object' ? child : createTextNode(child))
        }
    }
}

const createTextNode = (text) => {
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text,
            children: []
        }
    }
}

const createDom = (fiber) => {
    const dom = fiber.type == 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type)
    Object.keys(fiber.props).filter(key => key !== 'children').map((item) => {
        dom[item] = fiber.props[item]
    })
    return dom
}

function render(element, container) {
    // 创建根 fiber，设为下一次的单元任务
    nextUnitOfWork = {
        dom: container,
        props: {
            children: [element]
        }
    };
}

let nextUnitOfWork = null;

function workLoop(deadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }
    requestIdleCallback(workLoop);
}
// 一旦浏览器空闲，就触发执行单元任务
requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber);
    }
    // 子节点 DOM 插到父节点之后
    if (fiber.parent) {
        fiber.parent.dom.appendChild(fiber.dom);
    }
    // 为每个子元素创建新的 fiber
    const elements = fiber.props.children;
    let index = 0;
    let prevSibling = null;
    while (index < elements.length) {
        const element = elements[index];
        const newFiber = {
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: null
        };
        // 根据上面的图示，父节点只链接第一个子节点
        if (index === 0) {
            fiber.child = newFiber;
        } else {
            // 兄节点链接弟节点
            prevSibling.sibling = newFiber;
        }
        prevSibling = newFiber;
        index++;
    }
    // 返回下一个任务单元（fiber）
    // 有子节点直接返回
    if (fiber.child) {
        return fiber.child;
    }
    // 没有子节点则找兄弟节点，兄弟节点也没有找父节点的兄弟节点，
    // 循环遍历直至找到为止
    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent;
    }
    return null;
}

const Nami = {
    createElement,
    render
};

const element = ( <div id='foo'><p id='first'>123</p><p id='second'>456</p></div>);
const container = document.getElementById("root");
Nami.render(element, container);

/**
 * 问题：performUnitOfWork中每完成一个任务单元就会把节点添加到父节点上，浏览器可以随时打断渲染流程，此时UI界面会缺失。
 * 解决：将整个fiber树渲染完成后一次性添加到跟节点DOM上
 * 请看index.3.js
 */