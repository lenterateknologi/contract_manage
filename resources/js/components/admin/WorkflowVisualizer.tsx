import React, { useMemo, useCallback, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    Handle,
    Position,
    NodeProps,
    Edge,
    Node,
    MarkerType,
    BackgroundVariant,
    getBezierPath,
    BaseEdge,
    EdgeLabelRenderer,
    addEdge,
    useNodesState,
    useEdgesState,
    Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '@/lib/utils';
import { Shield, GitBranch, Users, Upload, CheckCircle2, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/base/Button';

type WorkflowNodeData = {
    label: string;
    type?: string;
    description?: string;
    isInitial?: boolean;
    isFinal?: boolean;
    onDelete?: () => void;
    organization?: {
        group?: string;
        region?: string;
        company?: string;
    };
};

// --- Custom Node Types ---
const WorkflowNode = ({ data }: NodeProps<Node<WorkflowNodeData>>) => {
    const Icon = useMemo(() => {
        const type = data.type?.toUpperCase() || '';
        switch (type) {
            case 'APPROVAL': return Shield;
            case 'REVIEW': return CheckCircle2; // Muted check for review
            case 'SELECTION': return Users;
            case 'UPLOAD': return Upload;
            case 'CLOSING': return CheckCircle2;
            default: return Shield;
        }
    }, [data.type]);

    return (
        <div className={cn(
            "relative px-4 py-3 rounded-xl border transition-all duration-200 min-w-[220px] select-none group",
            data.isFinal 
                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20" 
                : "bg-white border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800"
        )}>
            {/* Main Flow Handles (Vertical) */}
            {!data.isInitial && <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-slate-300 border-none hover:!bg-primary transition-colors" />}
            
            {/* Rejection Handles: Single Source (Bottom) and Single Target (Right) */}
            {!data.isInitial && <Handle type="target" position={Position.Right} id="reject-in" className="w-1.5 h-1.5 !bg-rose-300 border-none hover:!bg-rose-500 transition-colors" />}
            
            <Handle type="source" position={Position.Bottom} id="reject-out" style={{ left: '40%' }} className="w-1.5 h-1.5 !bg-rose-300 border-none hover:!bg-rose-500 transition-colors" />
            
            <div className="flex items-center gap-3">
                <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    data.isFinal ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400 dark:bg-white/5"
                )}>
                    <Icon size={14} />
                </div>
                <div className="flex flex-col text-left min-w-0 flex-1">
                    <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase leading-none mb-0.5">
                        {data.type || 'STEP'}
                    </span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                        {data.label}
                    </span>
                    {data.organization && (data.organization.group || data.organization.region || data.organization.company) && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {data.organization.group && (
                                <span className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">
                                    {data.organization.group}
                                </span>
                            )}
                            {data.organization.region && (
                                <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">
                                    {data.organization.region}
                                </span>
                            )}
                            {data.organization.company && (
                                <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">
                                    {data.organization.company}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Delete Button */}
                {!data.isInitial && data.onDelete && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            data.onDelete?.();
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-all text-slate-300"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            {!data.isFinal && <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-slate-300 border-none hover:!bg-primary transition-colors" />}
        </div>
    );
};

// --- Custom Edge Types ---
const RejectionEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
    data, // We'll pass the index here
}: any) => {
    // Calculate a unique offset for each edge to prevent nesting
    // 'idx' is the source step index. Higher index = further right
    const idx = data?.idx || 0;
    const distance = Math.abs(sourceY - targetY);
    
    // Create a path that exits down from bottom, arcs to the right, and enters the right side
    const horizontalOffset = 150 + (idx * 40);
    const verticalBuffer = 30;

    const edgePath = `
        M ${sourceX},${sourceY} 
        C ${sourceX},${sourceY + verticalBuffer} 
          ${sourceX + horizontalOffset},${sourceY + verticalBuffer} 
          ${sourceX + horizontalOffset},${(sourceY + targetY) / 2}
        C ${sourceX + horizontalOffset},${targetY} 
          ${targetX + 50},${targetY} 
          ${targetX},${targetY}
    `;

    // Calculate label position on the lateral part of the arc
    const labelX = sourceX + horizontalOffset;
    const labelY = (sourceY + targetY) / 2;

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            {label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            background: '#fff',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '8px',
                            fontWeight: 800,
                            color: '#f87171',
                            border: '1px solid #fee2e2',
                            pointerEvents: 'all',
                        }}
                        className="shadow-sm uppercase tracking-widest whitespace-nowrap"
                    >
                        {label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
};

const nodeTypes = {
    workflow: WorkflowNode,
};

const edgeTypes = {
    rejection: RejectionEdge,
};

interface WorkflowVisualizerProps {
    steps: any[];
    onChange?: (steps: any[]) => void;
    className?: string;
    readOnly?: boolean;
    companyGroups?: any[];
    regions?: any[];
    companies?: any[];
}

export function WorkflowVisualizer({ 
    steps, 
    onChange, 
    className, 
    readOnly = false,
    companyGroups = [],
    regions = [],
    companies = []
}: WorkflowVisualizerProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    // Initial Layout Engine
    useEffect(() => {
        const initialNodes: Node[] = [];
        const initialEdges: Edge[] = [];

        // Add "Start" node
        initialNodes.push({
            id: 'start',
            type: 'workflow',
            data: { label: 'MULAI', type: 'INITIATOR', isInitial: true },
            position: { x: 300, y: 0 },
        });

        steps.forEach((step, idx) => {
            const nodeId = `step-${idx + 1}`;
            // Stacked vertically with 220px spacing for more room
            const yPos = (idx + 1) * 220;

            const group = step.company_group_id ? companyGroups.find(g => g.id === step.company_group_id)?.name : null;
            const region = step.region_id ? regions.find(r => r.id === step.region_id)?.name : null;
            const company = step.company_id ? companies.find(c => c.id === step.company_id)?.name : null;

            initialNodes.push({
                id: nodeId,
                type: 'workflow',
                data: { 
                    label: step.description || `Tahap ${idx + 1}`, 
                    type: step.step_type,
                    isFinal: step.step_type === 'CLOSING',
                    onDelete: () => {
                        const newSteps = [...steps];
                        newSteps.splice(idx, 1);
                        onChange?.(newSteps);
                    },
                    organization: {
                        group,
                        region,
                        company
                    }
                },
                position: { x: 300, y: yPos },
            });

            // Connect sequence with a clean vertical line
            const prevId = idx === 0 ? 'start' : `step-${idx}`;
            initialEdges.push({
                id: `edge-${prevId}-${nodeId}`,
                source: prevId,
                target: nodeId,
                type: 'smoothstep', // Clean vertical line with optional rounded bends
                animated: true,
                style: { stroke: '#94a3b8', strokeWidth: 1.5 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
            });

            // Rejection edges with single handle points (lane logic still separates them)
            if (step.reject_target !== undefined && step.reject_target !== null) {
                const targetId = step.reject_target === 0 ? 'start' : `step-${step.reject_target}`;
                
                initialEdges.push({
                    id: `reject-${nodeId}-${targetId}`,
                    source: nodeId,
                    target: targetId,
                    type: 'rejection', // Using the custom edge type
                    data: { idx }, // Pass index for unique horizontal offset
                    sourceHandle: `reject-out`,
                    targetHandle: `reject-in`,
                    label: 'TOLAK',
                    style: { stroke: '#fca5a5', strokeWidth: 1, strokeDasharray: '4,4' },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#fca5a5' },
                });
            }
        });


        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [steps]);

    const addStep = useCallback(() => {
        if (readOnly || !onChange) return;
        const newSteps = [...steps, {
            description: "New Approval Step",
            step_type: "APPROVAL",
            reject_target: 0
        }];
        onChange(newSteps);
    }, [steps, onChange, readOnly]);

    const onConnect = useCallback((params: Connection) => {
        if (readOnly) return;
        
        // Custom connection logic for rejections
        if (params.sourceHandle === 'reject-out' && params.targetHandle === 'reject-in') {
            const newEdge: Edge = {
                ...params,
                id: `reject-${params.source}-${params.target}`,
                type: 'rejection',
                label: 'TOLAK',
                style: { stroke: '#fca5a5', strokeWidth: 1, strokeDasharray: '4,4' },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#fca5a5' },
                data: { idx: parseInt(params.source?.split('-')[1] || '0') - 1 }
            };
            setEdges((eds) => addEdge(newEdge, eds));
            
            // Sync back to steps array if needed
            if (onChange) {
                const sourceIdx = parseInt(params.source?.split('-')[1] || '0') - 1;
                const targetIdx = params.target === 'start' ? 0 : parseInt(params.target?.split('-')[1] || '0');
                const newSteps = [...steps];
                if (newSteps[sourceIdx]) {
                    newSteps[sourceIdx].reject_target = targetIdx;
                    onChange(newSteps);
                }
            }
        }
    }, [setEdges, steps, onChange, readOnly]);

    const onEdgeDelete = useCallback((edgesToDelete: Edge[]) => {
        if (readOnly) return;
        
        edgesToDelete.forEach(edge => {
            if (edge.type === 'rejection' && onChange) {
                const sourceIdx = parseInt(edge.source?.split('-')[1] || '0') - 1;
                const newSteps = [...steps];
                if (newSteps[sourceIdx]) {
                    newSteps[sourceIdx].reject_target = null;
                    onChange(newSteps);
                }
            }
        });
    }, [steps, onChange, readOnly]);

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (readOnly || node.id === 'start' || !onChange) return;
        
        const idx = parseInt(node.id.split('-')[1]) - 1;
        const currentStep = steps[idx];
        
        if (currentStep) {
            const newDescription = prompt("Enter step description:", currentStep.description);
            if (newDescription !== null) {
                const newSteps = [...steps];
                newSteps[idx] = { ...currentStep, description: newDescription };
                onChange(newSteps);
            }
        }
    }, [steps, onChange, readOnly]);

    return (
        <div className={cn("w-full h-full border border-slate-100 bg-slate-50/30 overflow-hidden dark:bg-slate-950/20 dark:border-slate-800", className)}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgesDelete={onEdgeDelete}
                onNodeClick={onNodeClick}
                nodesDraggable={!readOnly}
                nodesConnectable={!readOnly}
                elementsSelectable={!readOnly}
                fitView
                fitViewOptions={{ padding: 0.5 }}
                colorMode="system"
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
                <Controls showInteractive={false} className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800" />
            </ReactFlow>

            {/* Add Step Overlay */}
            {!readOnly && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <Button 
                        onClick={addStep}
                        className="bg-primary text-white rounded-2xl px-6 py-4 shadow-2xl hover:scale-105 transition-transform flex items-center gap-2 font-black uppercase tracking-widest text-[10px]"
                    >
                        <Plus size={16} />
                        Add New Step
                    </Button>
                </div>
            )}
        </div>
    );
}
