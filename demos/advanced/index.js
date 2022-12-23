import { createElement, parseSjdon, render, useState, useEffect } from '../lib/min.js/suiweb.min.js'

const TextField = props => {
    const [text, setText] = useState(props?.initialValue ?? '')
    return [
        'div',
        ['label', `Key: ${props?.key}, Name: ${props?.name} `,
            [
                'input',
                {
                    value: text,
                    oninput: event => setText(event.target.value),
                },
            ],
        ],
        ['p', 'Value: ', ['strong', text]],
    ]
}

const ConditionalToggler = props => {
    const [toggle, setToggle] = useState(false)

    return [
        'div',
        [DateComponent],
        ['button', { onclick: () => setToggle(!toggle) }, `Toggled:${toggle}`],
        ['article', 'Before Conditional'],
        toggle && [TextField, { name: 'Toggler First (conditional)', key: 'conditional' }],
        ['article', 'After Conditional'],
        [TextField, { name: 'Toggler Second (fixed)', key: 'second' }],
    ]
}

const MapToggler = props => {
    const [toggle, setToggle] = useState(false)

    const primary = [
        { key: 'first', name: 'First (primary)' },
        { key: 'second', name: 'Second (primary)' },
        { key: 'third', name: 'Third (primary)' },
        { key: 'fourth', name: 'Fourth (primary)' },
        { key: 'fifth', name: 'Fifth (primary)' },
        { key: 'sixth', name: 'Sixth (primary)' },
    ]
    const alternate = [
        { key: 'third', name: 'Third (alternate)' },
        { key: 'fourth', name: 'Fourth (alternate)' },
        { key: 'second', name: 'Second (alternate)' },
    ]

    const mapped = toggle
        ? primary.map((item, idx) => [TextField, { name: item.name, key: item.key }])
        : alternate.map((item, idx) => [TextField, { name: item.name, key: item.key }])

    return [
        'div',
        [DateComponent],
        ['button', { onclick: () => setToggle(!toggle) }, `Toggled:${toggle}`],
        ...mapped,
    ]
}

const DateComponent = () => {
    return [
        'p', 
        'If value changed, the component was rerendered: ', ['strong', Date.now()],
    ]
}

const FunctionalChildren = props => {
    return [
        'div', 
        ['p', 'This functional element has children'], 
        ...props?.children
    ]
}

const StaticElement = ['p', 'This is a static element. Pretty boring.', { style: { color: 'gray' } }]

const StyledCounter = () => {
    const [count, setCount] = useState(0)

    // Are all styles reset correctly
    const style =
        count % 2 == 0
            ? {
                backgroundColor: 'Salmon',
                borderColor: 'Salmon',
            }
            : {
                backgroundColor: 'MediumAquaMarine',
                borderColor: 'MediumAquaMarine',
            }

    return [
        'button', 
        { onclick: () => setCount(count + 1), style }, 
        `Clicked ${count} times`
    ]
}

const EffectComponent = props => {
    const [count1, setCount1] = useState(0)
    const [count2, setCount2] = useState(0)

    useEffect(() => console.log('useEffect without deps called.'))
    useEffect(() => console.log('useEffect with dependency count2 called.'), [count2])
    console.log('component called')

    return [
        'div',
        ['p', 'This component has effects which print on the console.'],
        ['div', {class: 'grid'},
            ['button', { onclick: () => setCount1(count1 + 1) }, `Count 1: ${count1}`],
            ['button', { onclick: () => setCount2(count2 + 1) }, `Count 2: ${count2}`]
        ]
    ]
}

const Demo = [
    'div',
    ['header', 
        ['h1', 'SuiWeb Demo']
    ],
    ['main',
        ['section',
            ['h2', 'Static Element'],
            StaticElement,
        ],
        ['section',
            ['h2', 'Normal Textfield'],
            [TextField, { name: 'Textfield', key: 1 }],
        ],
        ['section',
            ['h2', 'Styled Counter'],
            [StyledCounter],
        ],
        ['section',
            ['h2', 'Rerendering Check'],
            [DateComponent],
        ],
        ['section',
            ['h2', 'Effect Component'],
            [EffectComponent],
        ],
        ['section',
            ['h2', 'Functional component with chidren via props'],
            [FunctionalChildren, 
                ['article', 'Child 1'], 
                ['article', 'Child 2'], 
                [DateComponent]],
        ],
        ['section',
            ['h2', 'Conditional Rendering'],
            [ConditionalToggler],
        ],
        ['section',
            ['h2', 'Array Map Rendering'],
            [MapToggler],
        ],
    ],
    ['footer',
        'Built with ♥ in Winterthur',
    ],
]

const container = document.getElementById('app')
const parsed = parseSjdon(Demo, createElement)
render(parsed, container)
