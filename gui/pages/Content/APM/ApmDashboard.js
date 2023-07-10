import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from "next/image";
import style from "./Apm.module.css";
import 'react-toastify/dist/ReactToastify.css';
import {getActiveRuns, getAgentRuns, getAllAgents, getToolsUsage, getMetrics} from "@/pages/api/DashboardService";
import {formatNumber, formatTime, formatRunTimeDifference, averageAgentRunTime} from "@/utils/utils";
import {BarGraph} from "./BarGraph.js";
import { WidthProvider, Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);
export default function ApmDashboard() {
    const [agentDetails, setAgentDetails] = useState([]);
    const [tokenDetails, setTokenDetails] = useState([]);
    const [runDetails, setRunDetails] = useState(0);
    const [totalAgents, setTotalAgents] = useState(0);
    const [allAgents, setAllAgents] = useState([]);
    const [allModels, setAllModels] = useState([]);
    const [dropdown, setDropDown] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState('Select an Agent');
    const [selectedAgentIndex, setSelectedAgentIndex] = useState(-1);
    const [selectedAgentRun, setSelectedAgentRun] = useState([]);
    const [activeRuns, setActiveRuns] = useState([]);
    const [selectedAgentDetails, setSelectedAgentDetails] = useState(null);
    const [toolsUsed, setToolsUsed] = useState([]);
    const [averageRunTime, setAverageRunTime] = useState('');
    const initialLayout = [
        {i: 'total_agents', x: 0, y: 0, w: 3, h: 1.5},
        {i: 'total_tokens', x: 3, y: 0, w: 3, h: 1.5},
        {i: 'total_runs', x: 6, y: 0, w: 3, h: 1.5},
        {i: 'active_runs', x: 9, y: 0, w: 3, h: 4},
        {i: 'models_by_agents', x: 0, y: 1, w: 3, h: 2.5},
        {i: 'runs_by_model', x: 3, y: 1, w: 3, h: 2.5},
        {i: 'tokens_by_model', x: 6, y: 1, w: 3, h: 2.5},
        {i: 'agent_details', x: 0, y: 2, w: 12, h: 4},
        {i: 'total_tokens_consumed', x: 0, y: 3, w: 4, h: 2},
        {i: 'total_calls_made', x: 4, y: 3, w: 4, h: 2},
        {i: 'tokens_consumed_per_call', x: 8, y: 3, w: 4, h: 2},
    ];
    const storedLayout = localStorage.getItem('myLayoutKey');
    const [layout, setLayout] = useState(storedLayout !== null ? JSON.parse(storedLayout) : initialLayout);
    const firstUpdate = useRef(true);

    const onLayoutChange = (currentLayout) => {
        setLayout(currentLayout);
    };

    const onClickLayoutChange = () => {
        localStorage.setItem('myLayoutKey',JSON.stringify(initialLayout))
        setLayout(initialLayout)
    }

    useEffect(() => {
        if (!firstUpdate.current) {
            localStorage.setItem('myLayoutKey', JSON.stringify(layout));
        } else {
            firstUpdate.current = false;
        }
    }, [layout]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsResponse, agentsResponse, activeRunsResponse] = await Promise.all([getMetrics(), getAllAgents(), getActiveRuns()]);
                setAgentDetails(metricsResponse.data.agent_details);
                setTokenDetails(metricsResponse.data.tokens_details);
                setRunDetails(metricsResponse.data.run_details);
                setTotalAgents(agentsResponse.data.agent_details.length);
                setAllAgents(agentsResponse.data.agent_details);
                setActiveRuns(activeRunsResponse.data);
            } catch(error) {
                console.log(`Error in fetching data: ${error}`);
            }
        }

        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleSelectedAgent = useCallback((index, name) => {
        setDropDown(false)
        setSelectedAgent(name)
        setSelectedAgentIndex(index)
        const agentDetails = allAgents.find(agent => agent.agent_id === index);
        setSelectedAgentDetails(agentDetails);

        getAgentRuns(index).then((response) => {
            const data = response.data;
            setSelectedAgentRun(data);
            setAverageRunTime(averageAgentRunTime(data));
            console.log(data)
        }).catch((error) => console.error(`Error in fetching agent runs: ${error}`));
    }, [allAgents]);

    useEffect(() => handleSelectedAgent(selectedAgentIndex,selectedAgent),[allAgents]);

    useEffect(() => {
        if(allAgents.length > 0 && selectedAgent === 'Select an Agent') {
            const lastAgent = allAgents[allAgents.length-1];
            handleSelectedAgent(lastAgent.agent_id, lastAgent.name);
        }
    }, [allAgents, selectedAgent, handleSelectedAgent]);

    return (
        <div className={style.apm_dashboard_container}>
            <div id="apm_dashboard" className={style.apm_dashboard}>
                <div style={{display:'inline-flex',justifyContent:'space-between',width:'100%',alignItems:'center',padding:'0 8px'}}>
                    <span className="text_14 mt_10 ml_6">Agent Performance Monitoring</span>
                    <button onClick={() => onClickLayoutChange()} className="primary_button">Reset</button>
                </div>
                <ResponsiveGridLayout
                    className="layout"
                    layouts={{lg: layout}}
                    onLayoutChange={onLayoutChange}
                    breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                    cols={{lg: 12, md: 12, sm: 12, xs: 12, xxs: 12}}>
                    <div key="total_agents" className="display_column_container">
                        <span className="text_14 mb_8">Total Agents</span>
                        <div className="text_60_bold display_flex justify_center align_center w_100 h_100 mb_24 mt_24">{formatNumber(agentDetails.total_agents)}</div>
                    </div>
                    <div key="total_tokens" className="display_column_container">
                        <span className="text_14 mb_8">Total tokens consumed</span>
                        <div className="text_60_bold display_flex justify_center align_center w_100 h_100 mb_24 mt_24">{formatNumber(tokenDetails.total_tokens)}</div>
                    </div>
                    <div key="total_runs" className="display_column_container">
                        <span className="text_14 mb_8">Total runs</span>
                        <div className="text_60_bold display_flex justify_center align_center w_100 h_100 mb_24 mt_24">{formatNumber(runDetails.total_runs)}</div>
                    </div>

                    <div key="models_by_agents" className="display_column_container">
                        <span className="text_14 mb_8">Models used by Agents</span>
                        {agentDetails.model_metrics && <BarGraph data={agentDetails.model_metrics} type="value" color="#9E95FF"/>}
                    </div>

                    <div key="runs_by_model" className="display_column_container">
                        <span className="text_14 mb_8">Total runs by Models</span>
                        {runDetails.model_metrics && <BarGraph data={runDetails.model_metrics} type="value" color="#FFE76A"/>}
                    </div>

                    <div key="tokens_by_model" className="display_column_container">
                        <span className="text_14 mb_8">Total Tokens consumed by models</span>
                        {tokenDetails.model_metrics && <BarGraph data={tokenDetails.model_metrics} type="value" color="#83ACFB"/>}
                    </div>

                    <div key="agent_details" className="display_column_container">
                        <span className="text_14 mb_8">Agent Details</span>
                        {/*<div className="my_rows mt_24" style={{gap:'4px', padding:'0 7px'}}>*/}
                        {/*    <div className="my_col_4 text_12 vertical_container">Agent <span className="text_20_bold mt_10">{selectedAgentDetails?.name || '-'}</span></div>*/}
                        {/*    <div className="my_col_2 text_12 vertical_container align_end"><div className="vertical_container w_fit_content">Total Runs <span className="text_20_bold mt_10">{selectedAgentDetails?.runs_completed || '-'}</span></div></div>*/}
                        {/*    <div className="my_col_2 text_12 vertical_container align_end"><div className="vertical_container w_fit_content">Total Calls <span className="text_20_bold mt_10">{selectedAgentDetails?.total_calls || '-'}</span></div></div>*/}
                        {/*    <div className="my_col_2 text_12 vertical_container align_end"><div className="vertical_container w_fit_content">Tokens Consumed <span className="text_20_bold mt_10">{selectedAgentDetails?.total_tokens ? formatNumber(selectedAgentDetails.total_tokens) : '-' }</span></div></div>*/}
                        {/*    <div className="my_col_2 text_12 vertical_container align_end"><div className="vertical_container w_fit_content">Average run time <span className="text_20_bold mt_10">{averageRunTime !== '0.0 min' ? averageRunTime:'-'}</span></div></div>*/}
                        {/*</div>*/}
                        {allAgents.length === 0 ?
                            <div className="vertical_container align_center mt_50 w_100">
                                <img src="/images/no_permissions.svg" width={300} height={120} alt="No Data"/>
                                <span className="text_12 color_white mt_6">{selectedAgent === 'Select an Agent' ? 'Please Select an Agent' : <React.Fragment>No Runs found for <b>{selectedAgent}</b></React.Fragment>}</span>
                            </div> : <div className="scrollable_container mt_16">
                                <table className="table_css mt_10">
                                    <thead>
                                    <tr style={{borderTop:'none'}}>
                                        <th className="table_header">Agent Name</th>
                                        <th className="table_header text_align_right">Model <img width={14} height={14} src="/images/arrow_downward.svg" alt="arrow_down"/></th>
                                        <th className="table_header text_align_right">Tokens Consumed <img width={14} height={14} src="/images/arrow_downward.svg" alt="arrow_down"/></th>
                                        <th className="table_header text_align_right">Runs <img width={14} height={14} src="/images/arrow_downward.svg" alt="arrow_down"/></th>
                                        <th className="table_header text_align_right">Avg tokens per run <img width={14} height={14} src="/images/arrow_downward.svg" alt="arrow_down"/></th>
                                        <th className="table_header text_align_right">Tools <img width={14} height={14} src="/images/arrow_downward.svg" alt="arrow_down"/></th>
                                        <th className="table_header text_align_right">Calls <img width={14} height={14} src="/images/arrow_downward.svg" alt="arrow_down"/></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {allAgents.map((run, i) => (
                                        <tr key={i}>
                                            <td className="table_data" style={{width:'30%'}}>{run.name}</td>
                                            <td className="table_data text_align_right" style={{width:'10%'}}>{run.model_name}</td>
                                            <td className="table_data text_align_right" style={{width:'10%'}}>{run.total_tokens}</td>
                                            <td className="table_data text_align_right" style={{width:'10%'}}>{run.runs_completed}</td>
                                            <td className="table_data text_align_right" style={{width:'10%'}}>{run.total_tokens/run.runs_completed}</td>
                                            <td className="table_data text_align_right" style={{width:'20%'}}>{run.tools_used && run.tools_used.map((tool,index) => (
                                                <div>{tool}</div>
                                            ))}</td>
                                            <td className="table_data text_align_right" style={{width:'10%'}}>{run.total_calls}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>}
                    </div>
                    <div key="active_runs" className="display_column_container">
                        <span className="text_14 mb_8">Active Runs</span>
                        <div className="scrollable_container gap_8">
                            {activeRuns.length === 0 ?
                                <div className="vertical_container align_center mt_24">
                                    <img src="/images/no_permissions.svg" width={190} height={74} alt="No Data"/>
                                    <span className="text_12 color_white mt_6">No active runs found</span>
                                </div> : activeRuns.map((run,index) => (
                                    <div className="active_runs">
                                        <span className="text_14">{run.name}</span>
                                        <div style={{display:'inline-flex',alignItems:'center'}}><span className="text_12 mt_6">{run.agent_name}  ·  <Image width={12} height={12} src="/images/schedule.svg" alt="schedule-icon" /> {formatTime(run.created_at)}</span></div>
                                    </div>
                                ))}
                        </div>
                    </div>
                    <div key="total_tokens_consumed" className="display_column_container">
                        <div style={{display:'inline-flex',justifyContent:'space-between',width:'100%'}}>
                            <span className="text_14 mb_8">Total Tokens Consumed</span>
                            <div style={{position:'relative',display:'flex',flexDirection:'column'}}>
                                {allAgents.length > 0 && <div>
                                    <div className="text_14 mb_8 cursor_pointer" onClick={() => setDropDown(!dropdown)}>{selectedAgent} <img width={18} height={16} src="/images/expand_more.svg" /></div>
                                    {dropdown &&
                                        <div className="custom_select_options" style={{padding:'8px'}}>
                                            {allAgents.map((agent,index) => (
                                                <div key={index} className="custom_select_option" style={{padding: '8px'}} onClick={() => handleSelectedAgent(agent.agent_id,agent.name)}>{agent.name}</div>
                                            ))}
                                        </div>}
                                </div>}
                            </div>
                        </div>
                        <BarGraph data={selectedAgentRun} type="tokens_consumed" color="#83ACFB"/>
                    </div>

                    <div key="total_calls_made" className="display_column_container">
                        <span className="text_14 mb_8">Total Calls Made</span>
                        <BarGraph data={selectedAgentRun} type="calls" color="#83FBAC"/>
                    </div>
                    <div key="tokens_consumed_per_call" className="display_column_container">
                        <span className="text_14 mb_8">Tokens consumed per call</span>
                        <BarGraph data={selectedAgentRun} type="tokens_per_call" color="#83ACFB"/>
                    </div>
                </ResponsiveGridLayout>
            </div>
        </div>
    );
}