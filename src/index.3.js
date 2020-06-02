
/**
 * 具体来说，去掉 performUnitOfWork 的 fiber.parent.dom.appendChild 代码，换成如下代码。
 * 创建wiproot对象，在render时记录wiproot，并且将wiproot赋值给nextUnitOfWork
 * workLoop中在fiber渲染完成后执行commitRoot开始渲染，commitWork将所有节点appendChild到各自的父节点上
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

// 新增函数，提交根结点到 DOM
function commitRoot() {
    commitWork(wipRoot.child);
    wipRoot = null;
}
// 新增子函数
function commitWork(fiber) {
    if (!fiber) {
        return;
    }
    const domParent = fiber.parent.dom;
    domParent.appendChild(fiber.dom);
    // 递归子节点和兄弟节点
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function render(element, container) {
    // render 时记录 wipRoot
    wipRoot = {
        dom: container,
        props: {
            children: [element],
        },
    };
    nextUnitOfWork = wipRoot;
}
let nextUnitOfWork = null;
// 新增变量，跟踪渲染进行中的根 fiber
let wipRoot = null;

function workLoop(deadline) {
    let shouldYield = false;

    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        );
        shouldYield = deadline.timeRemaining() < 1;
    }

    // 当 nextUnitOfWork 为空则表示渲染 fiber 树完成了，
    // 可以提交到 DOM 了
    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }
    requestIdleCallback(workLoop);
}
// 一旦浏览器空闲，就触发执行单元任务
requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber);
    }

    const elements = fiber.props.children;
    let index = 0;
    let prevSibling = null;
    while (index < elements.length) {
        const element = elements[index];
        const newFiber = {
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: null,
        };

        if (index === 0) {
            fiber.child = newFiber;
        } else {
            prevSibling.sibling = newFiber;
        }
        prevSibling = newFiber;
        index++;
    }

    if (fiber.child) {
        return fiber.child;
    }

    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.parent;
    }
    return null
}

const Nami = {
    createElement,
    render
};

const element = ( <div id='foo'><p id='first'>123</p><p id='second'>456</p></div>);
const container = document.getElementById("root");
Nami.render(element, container);

/**
 * 问题：做到了添加节点，还未实现更新和删除节点
 * 解决：请看index.4.js
 */