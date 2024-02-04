document.addEventListener('DOMContentLoaded', function() {
    const gates = ['H', 'X', 'Y', 'Z', 'C', 'P', 'T', 'I', 'm'];
    const gatePalette = document.getElementById('gatePalette');
    const circuit = document.getElementById('circuit');
    let qubitCount = 0;

    // Function to allow dropping
    function allowDrop(ev) {
        ev.preventDefault();
    }

    // Function to handle drag start
    function dragStart(ev) {
        // Set the data to the type of gate instead of the element ID
        ev.dataTransfer.setData("text/plain", ev.target.textContent);
        ev.target.classList.add('dragging');
    }

    // Function to handle drag end
    function dragEnd(ev) {
        ev.target.classList.remove('dragging');
    }

    // Function to handle drop
    function drop(ev) {
        ev.preventDefault();
        const gateType = ev.dataTransfer.getData("text/plain");
    
        // Create a new gate element
        const gate = document.createElement('div');
        gate.textContent = gateType;
        gate.classList.add('gate');
        gate.setAttribute('draggable', 'true');
        gate.addEventListener('dragstart', dragStart);
        gate.addEventListener('dragend', dragEnd);
    
        let dropTarget = ev.target;
    
        // If the drop target is the qubit line or the wire, find the correct insert position
        if (dropTarget.classList.contains('qubit-line') || dropTarget.classList.contains('qubit-wire')) {
            // If the wire is the target, get its parent qubit line
            if (dropTarget.classList.contains('qubit-wire')) {
                dropTarget = dropTarget.parentNode;
            }
            
            // Get the bounding rectangle of the qubit linegit push -u origin master
            const qubitRect = dropTarget.getBoundingClientRect();
            // Calculate the horizontal position where the gate was dropped
            const dropPositionX = ev.clientX - qubitRect.left;
    
            // Find the insert position based on existing gates in the qubit line
            let insertAfterElement = null;
            const children = Array.from(dropTarget.children);
            for (let child of children) {
                if (child.classList.contains('gate') || child.classList.contains('qubit-label')) {
                    const childRect = child.getBoundingClientRect();
                    const childCenterX = childRect.left + childRect.width / 2 - qubitRect.left;
                    if (dropPositionX > childCenterX) {
                        insertAfterElement = child;
                    } else {
                        break;
                    }
                }
            }
    
            // Insert the new gate after the determined element or at the start if null
            if (insertAfterElement) {
                insertAfterElement.parentNode.insertBefore(gate, insertAfterElement.nextSibling);
            } else {
                // This would be the case if no gates are present or it should be the first gate
                dropTarget.insertBefore(gate, dropTarget.firstChild);
            }
            drawControlLines();

        }
    
        // Remove the dragging class from the original element in the palette
        document.querySelector('.dragging').classList.remove('dragging');
    }
    
    

    // Function to add a qubit line to the circuit
    function addQubit() {
        if (qubitCount < 8) {
            const qubitLine = document.createElement('div');
            qubitLine.classList.add('qubit-line');
            qubitLine.setAttribute('data-qubit', qubitCount);
            qubitLine.addEventListener('dragover', allowDrop);
            qubitLine.addEventListener('drop', drop);
            
            // Create and append the label
            const label = document.createElement('span');
            label.classList.add('qubit-label');
            label.textContent = `q[${qubitCount}]: `;
            qubitLine.appendChild(label);
            
            // Create and append the wire element
            const wire = document.createElement('div');
            wire.classList.add('qubit-wire');
            qubitLine.appendChild(wire);
            
            circuit.appendChild(qubitLine);
            qubitCount++;

            const removeButton = document.createElement('button');
            removeButton.textContent = 'x';
            removeButton.classList.add('remove-qubit');
            removeButton.onclick = removeQubit; // Attach the remove function
            qubitLine.appendChild(removeButton);
        } else {
            alert('Maximum of 8 qubits reached.');
        }
    }

    function removeQubit(ev) {
        const qubitLine = ev.target.parentNode;
        qubitLine.parentNode.removeChild(qubitLine);
        // Update the qubit count
        qubitCount--;
        // Update qubit labels
        updateQubitLabels();
        drawControlLines();

    }

    function updateQubitLabels() {
        const qubitLines = document.querySelectorAll('.qubit-line');
        qubitLines.forEach((line, index) => {
            const label = line.querySelector('.qubit-label');
            label.textContent = `q[${index}]: `;
        });
    }

    // Add gates to the palette
    gates.forEach(function(gate, index) {
        const gateElement = document.createElement('div');
        gateElement.textContent = gate;
        gateElement.classList.add('gate', 'palette-gate');
        gateElement.setAttribute('draggable', 'true');
        gateElement.setAttribute('id', `gate-${index}`);
        gateElement.addEventListener('dragstart', dragStart);
        gateElement.addEventListener('dragend', dragEnd);
        gatePalette.appendChild(gateElement);
    });


// Function to generate QUIC
function generateQuic() {
    const qubitLines = document.querySelectorAll('.qubit-line');
    const depthGates = [];
    let maxDepth = 0;

    // Find the maximum depth
    qubitLines.forEach(line => {
        maxDepth = Math.max(maxDepth, line.children.length - 1); // -1 to exclude the qubit label
    });

    // Initialize depthGates with 'I'
    for (let i = 0; i < maxDepth; i++) {
        depthGates[i] = Array(qubitLines.length).fill('I');
    }

    // Populate depthGates with actual gates
    qubitLines.forEach((line, qubitIndex) => {
        line.querySelectorAll('.gate').forEach((gate, gateIndex) => {
            depthGates[gateIndex][qubitIndex] = gate.textContent;
        });
    });

    // Join the gates with commas and create the QUIC string
    const quic = depthGates.map(depth => depth.join('')).join(',');
    
    // Output the QUIC (here we simply log it to the console, you can change this to display it on the page)
    console.log(quic);

    // Optionally, output to the page
    const quicDisplay = document.getElementById('quicDisplay');
    if (!quicDisplay) {
        const display = document.createElement('div');
        display.id = 'quicDisplay';
        display.textContent = quic;
        document.body.appendChild(display);
    } else {
        quicDisplay.textContent = quic;
    }
}
function drawControlLines() {
    // Clear any existing control lines
    document.querySelectorAll('.control-line').forEach(line => line.remove());

    // Iterate over each depth (column) to draw lines
    const maxDepth = findMaxDepth();
    for (let depth = 1; depth <= maxDepth; depth++) {
        let controlGateElement = null;
        const targetGatesElements = [];

        // Find control gate 'C' and target gates 'X', 'Y', 'Z' at this depth
        document.querySelectorAll(`.gate:nth-child(${depth + 1})`).forEach(gate => {
            if (gate.textContent === 'C') {
                controlGateElement = gate;
            } else if (['X', 'Y', 'Z'].includes(gate.textContent)) {
                targetGatesElements.push(gate);
            }
        });

        // Draw lines between control gate 'C' and target gates 'X', 'Y', 'Z'
        if (controlGateElement) {
            targetGatesElements.forEach(targetGate => {
                drawLine(controlGateElement, targetGate);
            });
        }
    }
}

function findMaxDepth() {
    return Array.from(document.querySelectorAll('.qubit-line'))
        .reduce((max, line) => Math.max(max, line.querySelectorAll('.gate').length), 0);
}

function drawLine(fromElement, toElement) {
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();
    const line = document.createElement('div');
    line.classList.add('control-line');
    line.style.opacity = '1';

    
    
    // Set the position of the line at the bottom of the 'C' gate
    line.style.position = 'absolute';
    line.style.left = `${fromRect.left + (fromRect.width / 2) - 1}px`; // -1 for the line width
    line.style.top = `${fromRect.bottom}px`;
    line.style.width = '2px'; // Line width
    line.style.height = `${toRect.top - fromRect.bottom}px`; // Height from the bottom of 'C' to the top of 'X', 'Y', 'Z'
    line.style.backgroundColor = 'grey';
    
    // Add the line to the body of the document
    document.body.appendChild(line);
    
}

    





document.getElementById('generateQuic').addEventListener('click', generateQuic);


    // Initialize with one qubit line
    addQubit();
    drawControlLines();


    // Add event listener for the 'Add Qubit' button
    document.getElementById('addQubit').addEventListener('click', function () {
        addQubit();
        drawControlLines();
    });
});