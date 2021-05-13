import React, {RefObject} from 'react';
import TopBar from './navbar/TopBar';
import {SettingsButton, VisualizeButton} from './navbar/Buttons';
import {
    AlgorithmDropDown,
    ClearDropDown,
    MazeDropDown,
    TilesDropDown
} from './navbar/DropDownComponents';
import {
    AlgorithmSettings,
    HeuristicSettings, 
    SpeedSettings,
    VisualSettings
} from './navbar/SettingPanels';
import DraggablePanel from './panel/DraggablePanel';
import PathfindingVisualizer from './grid/PathfindingVisualizer';
import PathfinderBuilder from '../pathfinding/algorithms/PathfinderBuilder';
import {
    MAZE,
    MAZE_HORIZONTAL_SKEW,
    MAZE_VERTICAL_SKEW,
    RANDOM_TERRAIN
} from '../pathfinding/algorithms/TerrainGeneratorBuilder';
import Icon from '../../images/react.png';
import AppSettings, {getDefaultSettings} from "../utils/AppSettings";

interface IProps {}

interface IState {
    settings: AppSettings,

    heuristicDisabled: boolean,
    bidirectionalDisabled: boolean,
    arrowsDisabled: boolean,
    scoreDisabled: boolean

    panelShow: boolean,

    visualizing: boolean,
    paused: boolean,

    useIcon: boolean
}

class PathfindingApp extends React.Component<IProps, IState>
{
    //expose visualizer to parent to connect to button siblings
    private visualizer: RefObject<PathfindingVisualizer> = React.createRef();

    //drop down refs needed to invoke behavior between dropdowns
    private algDropDown: RefObject<AlgorithmDropDown> = React.createRef();
    private clrDropDown: RefObject<ClearDropDown> = React.createRef();
    private mazeDropDown: RefObject<MazeDropDown> = React.createRef();
    private tilesDropDown: RefObject<TilesDropDown> = React.createRef();

    private readonly tileWidth: number;

    constructor(props: IProps) {
        super(props);
        this.state = {
            settings: getDefaultSettings(),
            heuristicDisabled: false,
            bidirectionalDisabled: false,
            arrowsDisabled: false,
            scoreDisabled: false,
            panelShow: false,
            visualizing: false,
            paused: false,
            useIcon: this.useIcon()
        }
        const speed = this.state.settings.delayInc;
        const mobile = isMobile();
        this.tileWidth =  mobile ? 47 : Math.round(window.screen.availWidth / 57);
        if(mobile) {
            this.changeSpeed(speed + 20);
        } else if(window.screen.availWidth > 2500) {
            this.changeSpeed(speed + 10);
        }
    }

    /**
     * Binds window listeners.
     * One listener is to hide drop downs on click anywhere
     * Other listener is to keep track of screen size to check if we show icon
     */
    componentDidMount() {
        window.addEventListener('click', () => {
            this.algDropDown.current!.hide();
            this.clrDropDown.current!.hide();
            this.mazeDropDown.current!.hide();
            this.tilesDropDown.current!.hide();
        });
        window.addEventListener('resize', () => {
            this.setState({
                useIcon: this.useIcon()
            })
        });
    }

    useIcon() {
        return window.innerWidth <= 850;
    }

    /**
     * Called when the drop downs are clicked to prevent more
     * than one dropdown from being open at a time
     */

    onClickAlgDrop() {
        this.clrDropDown.current!.hide();
        this.mazeDropDown.current!.hide();
        this.tilesDropDown.current!.hide();
    }

    onClickClrDrop() {
        this.algDropDown.current!.hide();
        this.mazeDropDown.current!.hide();
        this.tilesDropDown.current!.hide();
    }

    onClickMazeDrop() {
        this.clrDropDown.current!.hide();
        this.algDropDown.current!.hide();
        this.tilesDropDown.current!.hide();
    }

    onClickTilesDrop() {
        this.clrDropDown.current!.hide();
        this.algDropDown.current!.hide();
        this.mazeDropDown.current!.hide();
    }

    /**
     * Utility functions to change overall state of application
     * Settings, overall appearance, etc
     */

    changeVButtonColor(visualizing: boolean) {
        this.setState({
            visualizing: visualizing
        })
    }

    toggleSettings() {
        this.setState(prevState => ({
            panelShow: !prevState.panelShow
        }));
    }

    hideSettings() {
        this.setState({
            panelShow: false
        });
    }

    doPathfinding() {
        this.setState({
            paused: false
        });
        this.visualizer.current!.doDelayedPathfinding();
    }

    pausePathfinding() {
        this.setState({
            paused: true
        });
        this.visualizer.current!.pausePathfinding();
    }

    resumePathfinding() {
        this.setState({
            paused: false
        });
        this.visualizer.current!.resumePathfinding();
    }

    clearPath() {
        this.visualizer.current!.clearPath();
        this.visualizer.current!.clearVisualizationChecked();
    }

    clearTiles() {
        this.clearPath();
        this.visualizer.current!.clearTilesChecked();
    }

    resetBoard() {
        this.clearPath();
        this.clearTiles();
        this.visualizer.current!.resetPoints();
    }

    createMaze() {
        this.visualizer.current!.createTerrain(MAZE, false);
    }

    createMazeVSkew() {
        this.visualizer.current!.createTerrain(MAZE_VERTICAL_SKEW, false);
    }

    createMazeHSkew() {
        this.visualizer.current!.createTerrain(MAZE_HORIZONTAL_SKEW, false);
    }

    createRandomTerrain() {
        this.visualizer.current!.createTerrain(RANDOM_TERRAIN, true);
    }

    changeTile(cost: number) {
        this.visualizer.current!.changeTile({
            isSolid: cost === -1,
            pathCost: cost
        });
    }

    /**
     * Functions to modify app's settings
     */

    changeAlgo(algorithm: string) {
        this.setState(prevState => ({
            heuristicDisabled: !PathfinderBuilder.usesHeuristic(algorithm),
            bidirectionalDisabled: !PathfinderBuilder.hasBidirectional(algorithm),
            scoreDisabled: !PathfinderBuilder.usesWeights(algorithm),
            arrowsDisabled: !PathfinderBuilder.usesBreadthTree(algorithm),
            settings: {
                ...prevState.settings,
                algorithm: algorithm
            }
        }));
    }

    changeVisualize() {
        this.setState(prevState => ({
            settings: {
                ...prevState.settings,
                visualizeAlg: !prevState.settings.visualizeAlg
            }
        }));
    }

    changeShowArrows() {
        this.setState(prevState => ({
            settings: {
                ...prevState.settings,
                showArrows: !prevState.settings.showArrows
            }
        }));
    }

    changeShowScores() {
        this.setState(prevState => ({
            settings: {
                ...prevState.settings,
                showScores: !prevState.settings.showScores
            }
        }));
    }

    changeBidirectional() {
        this.setState(prevState => ({
            settings: {
                ...prevState.settings,
                bidirectional: !prevState.settings.bidirectional
            }
        }));
    }

    changeSpeed(value: number) {
        this.setState(prevState => ({
            settings: {
                ...prevState.settings,
                delayInc: value
            }
        }));
    }

    changeManhattan() {
        this.setState(prevState => ({
            settings: {
                ...prevState.settings,
                heuristicKey: 'manhattan'
            }
        }));
    }

    changeEuclidean() {
        this.setState(prevState => ({
            settings: {
                ...prevState.settings,
                heuristicKey: 'euclidean'
            }
        }));
    }

    changeChebyshev() {
        this.setState(prevState => ({
            settings: {
                ...prevState.settings,
                heuristicKey: 'chebyshev'
            }
        }));
    }

    changeOctile() {
        this.setState(prevState => ({
            settings: {
                ...prevState.settings,
                heuristicKey: 'octile'
            }
        }));
    }

    render() {
        const title: string = 'Pathfinding Visualizer';
        const icon = this.state.useIcon ?
            <img
                width={'100%'} height={'100%'}
                className='icon'
                alt={title} src={Icon}
            /> :
            title;
        return (
            <div>
                <DraggablePanel
                    title='Grid Settings'
                    show={this.state.panelShow}
                    onClickXButton={() => this.hideSettings()}
                    width={350}
                    height={425}
                >
                    <VisualSettings
                        disabledTree={this.state.arrowsDisabled}
                        disabledScore={this.state.scoreDisabled}
                        onChangeViz={() => this.changeVisualize()}
                        onChangeShowArrows={() => this.changeShowArrows()}
                        onChangeShowScores={() => this.changeShowScores()}
                    />
                    <SpeedSettings
                        onChange={(value: number) => this.changeSpeed(value)}
                        initialSpeed={this.state.settings.delayInc}
                    />
                    <AlgorithmSettings
                        disabled={this.state.bidirectionalDisabled}
                        onChangeBidirectional={() => this.changeBidirectional()}
                    />
                    <HeuristicSettings
                        disabled={this.state.heuristicDisabled}
                        onClickManhattan={() => this.changeManhattan()}
                        onClickEuclidean={() => this.changeEuclidean()}
                        onClickChebyshev={() => this.changeChebyshev()}
                        onClickOctile={() => this.changeOctile()}
                    />
                </DraggablePanel>
                <TopBar>
                    <a href='https://github.com/JosephPrichard/PathfinderReact' className='title'
                       style={{
                           width: this.state.useIcon ? 70 : 'auto',
                           height: this.state.useIcon ? 52 : '100%'
                       }}
                    >
                        {icon}
                    </a>
                    <div className='top-container'>
                        <AlgorithmDropDown
                            ref={this.algDropDown}
                            onClick={() => this.onClickAlgDrop()}
                            onChange={(alg: string) => this.changeAlgo(alg)}
                        />
                        <VisualizeButton
                            active={this.state.visualizing}
                            paused={this.state.paused}
                            onPause={() => this.pausePathfinding()}
                            onResume={() => this.resumePathfinding()}
                            onStartStop={() => this.doPathfinding()}
                        />
                        <ClearDropDown
                            ref={this.clrDropDown}
                            onClick={() => this.onClickClrDrop()}
                            onClickTiles={() => this.clearTiles()}
                            onClickPath={() => this.clearPath()}
                            onClickReset={() => this.resetBoard()}
                        />
                        <TilesDropDown
                            ref={this.tilesDropDown}
                            onClick={() => this.onClickTilesDrop()}
                            onClickTileType={(cost: number) => this.changeTile(cost)}
                        />
                        <MazeDropDown
                            ref={this.mazeDropDown}
                            onClick={() => this.onClickMazeDrop()}
                            onClickMaze={() => this.createMaze()}
                            onClickMazeHorizontal={() => this.createMazeHSkew()}
                            onClickMazeVertical={() => this.createMazeVSkew()}
                            onClickRandomTerrain={() => this.createRandomTerrain()}
                        />
                        <SettingsButton onClick={() => this.toggleSettings()}/>
                    </div>
                </TopBar>
                <PathfindingVisualizer
                    ref={this.visualizer}
                    onChangeVisualizing={(viz: boolean) => this.changeVButtonColor(viz)}
                    settings={this.state.settings}
                    tileWidth={this.tileWidth}/>
            </div>
        );
    }
}

function isMobile() {
    return /Android|webOS|iPhone|iPad|Mac|Macintosh|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export default PathfindingApp;