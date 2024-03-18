document.addEventListener('DOMContentLoaded', function() {
    const gates = ['H', 'X', 'Y', 'Z', 'C', 'N', 'P', 'T', 'I', 'm'];
    const gatePalette = document.getElementById('gatePalette');
    const circuit = document.getElementById('circuit');
    let qubitCount = 0;
    let draggedGate = null;
    let quic;

    // Function to allow dropping
    function allowDrop(ev) {
        ev.preventDefault();
    }

    // Function to handle drag start
    function dragStart(ev) {
        // Set the data to the type of gate instead of the element ID
        ev.dataTransfer.setData("text/plain", ev.target.textContent);
        ev.target.classList.add('dragging');
        draggedGate = ev.target;
    
        // Check if the dragged gate is from the palette or from the circuit
        if (!ev.target.classList.contains('palette-gate')) {
            // The gate is from the circuit, set a flag in the dataTransfer object
            ev.dataTransfer.setData("fromCircuit", "true");
        }
        
    }



    // Function to handle drag end
    function dragEnd(ev) {
        // Check if the dragged gate is from the palette or from the circuit
        const fromCircuit = ev.dataTransfer.getData("fromCircuit") === "true";
    
        // If the gate is from the circuit and it's outside the circuit, remove it
        if (fromCircuit) {
            ev.target.remove();
        }
    
        // Remove the dragging class from the original element in the palette
        ev.target.classList.remove('dragging');
    }

    // Function to handle drop
    // Function to handle drop
    function drop(ev) {
        ev.preventDefault();
        const gateType = ev.dataTransfer.getData("text/plain");
    
        
    
        const fromCircuit = ev.dataTransfer.getData("fromCircuit") === "true";
        clearControlLines();
    
        let gate;
        if (!fromCircuit) {
            // Create a new gate if it's dragged from the palette
            gate = document.createElement('div');
            gate.textContent = gateType;
            gate.classList.add('gate', 'circuit-gate');
            gate.setAttribute('draggable', 'true');
            gate.addEventListener('dragstart', dragStart);
            gate.addEventListener('dragend', dragEnd);
        } else if (draggedGate) {
            // If the gate is dragged from the circuit, use it directly
            gate = draggedGate;
        }
    
        let dropTarget = ev.target;
        if (dropTarget.classList.contains('gate')) {
            // Dropping on another gate - replace it with the new/dragged gate
            const parentLine = dropTarget.parentNode;
            parentLine.replaceChild(gate, dropTarget);
        } else {
            // Normal placement or repositioning logic
            placeGate(dropTarget, gate, ev.clientX);
        }
    
        drawControlLines();
        // Reset dragged gate reference after drop
        draggedGate = null;
    }

    function placeGate(dropTarget, gate, dropX) {
        dropTarget = dropTarget.closest('.qubit-line') || dropTarget;
        if (dropTarget.classList.contains('qubit-line')) {
            const qubitRect = dropTarget.getBoundingClientRect();
            const dropPositionX = dropX - qubitRect.left;
    
            let insertAfterElement = null;
            const children = Array.from(dropTarget.children);
    
            // Adjust drop position if there is a separator
            const adjustedDropPositionX = dropPositionX;
    
            for (let child of children) {
                if (child.classList.contains('gate')) {
                    const childRect = child.getBoundingClientRect();
                    const childCenterX = childRect.left + childRect.width / 2 - qubitRect.left;
                    if (adjustedDropPositionX > childCenterX) {
                        insertAfterElement = child;
                    } else {
                        // If dropping onto an existing gate, replace it
                        if (dropPositionX >= childRect.left - qubitRect.left && dropPositionX <= childRect.right - qubitRect.left) {
                            dropTarget.replaceChild(gate, child);
                            return; // Exit the function after replacing the gate
                        }
                        break;
                    }
                }
            }
    
            // Place the gate at the adjusted position if there's no gate to replace
            if (insertAfterElement) {
                insertAfterElement.parentNode.insertBefore(gate, insertAfterElement.nextSibling);
            } else {
                // Append at the beginning if no gates are present or the position is at the start
                const qubitLabel = dropTarget.querySelector('.qubit-label');
                if (qubitLabel) {
                    // If there's a label, insert after the label
                    dropTarget.insertBefore(gate, qubitLabel.nextSibling);
                } else {
                    // If no label, append as the first child
                    dropTarget.insertBefore(gate, dropTarget.firstChild);
                }
            }
        }
    }

    function clearControlLines() {
        document.querySelectorAll('.control-line').forEach(line => line.remove());
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
        maxDepth = Math.max(maxDepth, line.children.length - 3); // -1 to exclude the qubit label
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
    quic = depthGates.map(depth => depth.join('')).join(',');
    
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
        bubble_fn_quic(quic);
    }
}
function runCircuitFromString(circuitString) {
    // Clear existing circuit first
    document.getElementById('refresh').click();

    const steps = circuitString.split(',');
    const qubitCount = steps[0].length; // Determine the number of qubits based on the first step

    // Ensure there are enough qubits
    while (qubitCount > document.querySelectorAll('.qubit-line').length) {
        addQubit();
    }

    // Iterate over each step to place gates
    steps.reverse().forEach((step, stepIndex) => {
        step.split('').forEach((gate, qubitIndex) => {
            
            const qubitLine = document.querySelector(`.qubit-line[data-qubit="${qubitIndex}"]`);
            placeGate(qubitLine, gate, stepIndex + 2); // +2 to account for qubit label and wire
        
        });
    });

    function placeGate(qubitLine, gateType) {
        const gate = document.createElement('div');
        gate.textContent = gateType;
        gate.classList.add('gate', 'circuit-gate');
        gate.setAttribute('draggable', 'true');
        gate.addEventListener('dragstart', dragStart);
        gate.addEventListener('dragend', dragEnd);
        // Insert the new gate right after the qubit label, which is the first child
        const insertPosition = findInsertPosition(qubitLine);
        qubitLine.insertBefore(gate, insertPosition);
    }

    function findInsertPosition(qubitLine) {
        // Find the position where the new gate should be inserted. This logic ensures that gates
        // added through the Run button are placed at the correct position within the qubit line.
        const children = Array.from(qubitLine.children);
        let insertAfterLabel = qubitLine.firstChild; // Start with the label
        for (let child of children) {
            if (child.classList.contains('gate')) {
                insertAfterLabel = child;
            } else {
                break; // Stop once the first gate is found
            }
        }
        return insertAfterLabel ? insertAfterLabel.nextSibling : qubitLine.firstChild.nextSibling;
    }

    drawControlLines();

    
}

function drawControlLines() {
    // Clear any existing control lines
    // Modify this part in the drawControlLines function:
    document.querySelectorAll('.gate.red-border').forEach(gate => gate.classList.remove('red-border'));

    // Iterate over each depth (column) to find connections and draw lines
    const maxDepth = findMaxDepth();
    for (let depth = 0; depth <= maxDepth; depth++) {
        let controlGateElement = null;
        const targetGatesElements = [];

        // Find control gate 'C' and target gates 'X', 'Y', 'Z' at this depth in the circuit
        circuit.querySelectorAll(`.qubit-line .gate:nth-child(${depth + 2})`).forEach(gate => {
            if (gate.textContent === 'C') {
                controlGateElement = gate;
            } else if (['X', 'Y', 'Z', 'N'].includes(gate.textContent)) {
                targetGatesElements.push(gate);
            }
        });

        // Only draw lines and add red borders if there is a control and at least one target gate
        if (controlGateElement && targetGatesElements.length > 0) {
            controlGateElement.classList.add('red-border');
            targetGatesElements.forEach(targetGate => {
                // Draw line between control and target gate
                drawLine(controlGateElement, targetGate);
                // Add red border to target gate
                targetGate.classList.add('red-border');
            });
        }
    }

// Your existing drawLine function appears correct; it should draw the line correctly now

}


function findMaxDepth() {
    return Array.from(document.querySelectorAll('.qubit-line'))
        .reduce((max, line) => Math.max(max, line.querySelectorAll('.gate').length), 0);
}

function drawLine(fromElement, toElement) {
    // Calculate the top and bottom positions of the gates
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    // Determine the starting and ending Y positions of the line
    const startY = Math.min(fromRect.bottom, toRect.bottom);
    const endY = Math.max(fromRect.top, toRect.top);

    // Create the line element
    const line = document.createElement('div');
    line.classList.add('control-line');
    
    // Set the position and style of the line
    line.style.position = 'absolute';
    line.style.left = `${fromRect.left + (fromRect.width / 2) - 1}px`; // Center the line on the gate
    line.style.top = `${startY}px`; // Start from the bottom of the 'C' gate
    line.style.width = '2px';
    line.style.height = `${endY - startY}px`; // The height should be the difference between the endY and startY
    line.style.backgroundColor = 'grey';
    
    // Add the line to the body of the document or to a specific container if required
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
    document.getElementById('circuit').addEventListener('dragover', function(ev) {
        ev.preventDefault();
    });
    document.addEventListener('drop', function(ev) {
        ev.preventDefault();
        // Check if the drop event occurred outside the "circuitContainer" element
        if (draggedGate && ev.target.id !== 'circuit' && !ev.target.closest('#circuit')) {
            draggedGate.parentNode.removeChild(draggedGate);
            draggedGate = null;
        }
    });

    document.getElementById('runCircuit').addEventListener('click', function () {
        const circuitString = document.getElementById('circuitInput').value;
        runCircuitFromString(circuitString);

    });
    
    document.getElementById('refresh').addEventListener('click', function () {
        // Remove all qubit lines
        const qubitLines = document.querySelectorAll('.qubit-line');
        qubitLines.forEach((line) => {
            line.parentNode.removeChild(line);
        });
    
        const controlLines = document.querySelectorAll('.control-line');
        controlLines.forEach((line) => {
            line.remove(); // This removes the control lines from the DOM
        });

        const separatorLines = document.querySelectorAll('.circuit-separator');
        separatorLines.forEach((line) => {
            line.remove(); // This removes the separator lines from the DOM
        });


        // Reset qubit count
        qubitCount = 0;

        
    
        // Add one default qubit line
        addQubit();
        drawControlLines();

        document.getElementById('quicDisplay').innerHTML = '';
    });
    
});
