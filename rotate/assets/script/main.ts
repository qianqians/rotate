import { _decorator, Component, assetManager, gfx, AssetManager, Mesh, Node, MeshRenderer, Vec3, utils, primitives, random } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('main')
export class main extends Component {
    private bundles:Map<string, AssetManager.Bundle> = new Map();

    @property(Node)
    private model:Node;

    private loadBundle(bundleRes:string) : Promise<AssetManager.Bundle> {
        return new Promise((resolve) => {
            try {
                assetManager.loadBundle(bundleRes,(error,bundle) => {
                    if(error) {
                        console.warn(error.message);
                        resolve(null);
                    }
                    else {
                        resolve(bundle);
                    }
                });
            }
            catch (err) {
                console.warn(`bundleRes:${bundleRes}, ${err}`);
                resolve(null);
            }    
        });
    }

    private loadMeshFromBundle(bundleRes:string, assetsRes:string) : Promise<Mesh> {   
        return new Promise(async (resolve) => {
            try {
                let bundle : AssetManager.Bundle = null;
                if (this.bundles.has(bundleRes)) {
                    bundle = this.bundles.get(bundleRes);
                }
                else {
                    bundle = await this.loadBundle(bundleRes);
                    this.bundles.set(bundleRes, bundle);
                }
                console.log(bundle);

                bundle.load(assetsRes, Mesh, (error, asset) => {
                    if(error) {
                        console.warn("loadAssetsFromBundle ", error.message);
                        resolve(null);
                    }
                    else {
                        resolve(asset);
                    }
                });
            }
            catch (err) {
                console.warn(`bundleRes:${bundleRes}, assetsRes:${assetsRes}, ${err}`);
                resolve(null);
            }    
        });
    } 

    async start() {
        let apple = await this.loadMeshFromBundle("model", "apple/Sphere001");
        
        let positions = apple.readAttribute(0, gfx.AttributeName.ATTR_POSITION) as Float32Array;
        let normals = apple.readAttribute(0, gfx.AttributeName.ATTR_NORMAL) as Float32Array;
        let uv = apple.readAttribute(0, gfx.AttributeName.ATTR_TEX_COORD) as Float32Array;
        let tangent = apple.readAttribute(0, gfx.AttributeName.ATTR_TANGENT) as Float32Array;
        let indices = apple.readIndices(0) as Uint32Array;

        let newPositions = new Float32Array(indices.length * 3);
        let newNormals = new Float32Array(indices.length * 3);
        let newUVs = new Float32Array(indices.length * 3);
        let newTangents = new Float32Array(indices.length * 3);
        let minPos = new Vec3(Infinity, Infinity, Infinity);
        let maxPos = new Vec3(-Infinity, -Infinity, -Infinity);
        let newPos = new Vec3();
        for (let i = 0; i < indices.length; i++) {
            const index = indices[i];
            for (let k = 0; k < 3; k++) {
                newPositions[i * 3 + k] = positions[index * 3 + k];
                newNormals[i * 3 + k] = normals[index * 3 + k];
                newUVs[i * 3 + k] = uv[index * 3 + k];
                newTangents[i * 3 + k] = tangent[index * 3 + k];
            }
            newPositions[i * 3 + 2] = newPositions[i * 3 + 2] + random();

            newPos.set(newPositions[i * 3], newPositions[i * 3 + 1], newPositions[i * 3 + 2]);
            Vec3.min(minPos, minPos, newPos);
            Vec3.max(maxPos, maxPos, newPos);
        }

        let geometry: primitives.IDynamicGeometry = {
            positions: newPositions,
            normals: newNormals,
            uvs: newUVs,
            tangents: newTangents,
            minPos: minPos,
            maxPos: maxPos,
        }
        let opt: primitives.ICreateDynamicMeshOptions = {
            maxSubMeshes: 1,
            maxSubMeshVertices: indices.length,
            maxSubMeshIndices: indices.length,
        }
        let mesh = new Mesh();
        mesh = utils.MeshUtils.createDynamicMesh(0, geometry, mesh, opt);

        let rt = this.model.getComponent(MeshRenderer);
        rt.mesh = mesh;
        this.model.setRotationFromEuler(new Vec3(random(), random(), random()))
    }

    update(deltaTime: number) {
        
    }
}


