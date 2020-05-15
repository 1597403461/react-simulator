/**
 * 简单实现流程：首先知道jsx语法其实调用的就是createElement方法：createElement方法返回的一个包含 type 和 props 的元素对象,描述节点信息（就是把 JSX 结构转成元素描述对象）
 * <div id='foo'><p>123</p><p>456</p></div> ----createElement---->>>  React.createElement("div",{ id: "foo" },React.createElement("p", null, "123"),React.createElement("p",null,'456'))
 * createElement其第一个参数是jsx标签名称（div、span等），第二个参数是标签属性（例如class，id，style等），剩余参数即为改标签元素的子节点
 * createElement最后生成的是一个dom树
 * render就是将createElement生成的节点dom对象更新到根节点
 */
const createElement = (type, props, ...children) => {
    // 官方还涉及很多其他属性
    return {
        type,
        props: {
            ...props,
            children: children.map(child => typeof child === 'object' ? child : createTextNode(child))
        }
    }
}

/**
 * text是字符串或者数字这类基础类型值时，给这里值包裹成 TEXT_ELEMENT 特殊类型，方便后面统一处理。
 */
const createTextNode = (text) => {
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text,
            children: []
        }
    }
}

const render = (element, container) => {
    const dom = element.type == 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(element.type)
    Object.keys(element.props).filter(key => key !== 'children').map((item) => {
        dom[item] = element.props[item]
    })
    element.props.children.forEach((child) => {
        render(child, dom)
    })
    container.appendChild(dom);
}

const Nami = {
    createElement,
    render
};

const element = ( <div id='foo'><p>123</p><p>456</p></div>);
const container = document.getElementById("root");
Nami.render(element, container);

/**
 * 问题： render是递归遍历整个dom节点树，此方式阻塞主线程
 * 解决： 将render进行拆分实现渲染，没完成一个单元的任务，允许浏览器打断渲染响应更高优先级的工作
 * 请看index.2.js
 */