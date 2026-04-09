VERSION 5.00
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form Det_Viajes 
   BackColor       =   &H80000007&
   Caption         =   "Detalle de Viajes por Fleteros"
   ClientHeight    =   2370
   ClientLeft      =   60
   ClientTop       =   390
   ClientWidth     =   6660
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   2370
   ScaleWidth      =   6660
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   3
      Left            =   2160
      TabIndex        =   3
      Text            =   "Text1"
      Top             =   720
      Width           =   4095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   2
      Left            =   1440
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   720
      Width           =   615
   End
   Begin MSMask.MaskEdBox FDesde 
      Height          =   285
      Left            =   1440
      TabIndex        =   4
      Top             =   1200
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   2160
      TabIndex        =   6
      Text            =   "Text1"
      Top             =   240
      Width           =   4095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   1440
      TabIndex        =   0
      Text            =   "Text1"
      Top             =   240
      Width           =   615
   End
   Begin MSMask.MaskEdBox FHasta 
      Height          =   285
      Left            =   4680
      TabIndex        =   5
      Top             =   1200
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin KewlButtonz.KewlButtons Buscar 
      Height          =   495
      Left            =   1800
      TabIndex        =   9
      Top             =   1800
      Width           =   3135
      _ExtentX        =   5530
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Consultar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "Det_Viajes.frx":0000
      PICN            =   "Det_Viajes.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Label1 
      BackColor       =   &H80000007&
      Caption         =   "Fletero"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   3
      Left            =   240
      TabIndex        =   10
      Top             =   720
      Width           =   1215
   End
   Begin VB.Label Label1 
      BackColor       =   &H80000007&
      Caption         =   "Hasta:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   2
      Left            =   3240
      TabIndex        =   8
      Top             =   1200
      Width           =   1215
   End
   Begin VB.Label Label1 
      BackColor       =   &H80000007&
      Caption         =   "Desde:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   1
      Left            =   240
      TabIndex        =   7
      Top             =   1200
      Width           =   1215
   End
   Begin VB.Label Label1 
      BackColor       =   &H80000007&
      Caption         =   "Empresa"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   0
      Left            =   240
      TabIndex        =   1
      Top             =   240
      Width           =   1215
   End
End
Attribute VB_Name = "Det_Viajes"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Buscar_Click()
If Not Text1(0).Text = "" And Not FDesde.Text = "__/__/____" And Not FHasta.Text = "__/__/____" Then
    Set rsViajes = db.OpenRecordset("SELECT * FROM LiqDetViajes WHERE CodEmpresa = " & Text1(0).Text & " AND CodFlet = " & Text1(2) & " AND Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " # ORDER BY Fecha")
    If Not rsViajes.EOF And Not rsViajes.BOF Then
        Set rsViajesFlet = dbTemp.OpenRecordset("SELECT * FROM ViajesFlet")
        Do While Not rsViajesFlet.EOF
            rsViajesFlet.Delete
            rsViajesFlet.MoveNext
        Loop
        Do While Not rsViajes.EOF
            rsViajesFlet.AddNew
            rsViajesFlet.Fields("Fecha") = rsViajes!Fecha
            rsViajesFlet.Fields("CodEmp") = rsViajes!CodEmpresa
            rsViajesFlet.Fields("NroLiq") = rsViajes!NroLiq
            rsViajesFlet.Fields("DescEmpresa") = rsViajes!DescEmpresa
            rsViajesFlet.Fields("DescChofer") = rsViajes!DescChofer
            rsViajesFlet.Fields("Mercaderia") = rsViajes!MErcaderia
            rsViajesFlet.Fields("Procedencia") = rsViajes!Procedencia
            rsViajesFlet.Fields("Destino") = rsViajes!Destino
            rsViajesFlet.Fields("Tarifa") = rsViajes!Tarifa
            rsViajesFlet.Fields("Kilos") = rsViajes!Kilos
            rsViajesFlet.Fields("SubTotal") = rsViajes!SubTotal
            rsViajesFlet.Fields("CodFlet") = rsViajes!CodFlet
            Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & rsViajes!CodFlet & "", 2)
            rsViajesFlet.Fields("DescFlet") = rsFleteros!Descflet
            rsViajesFlet.Update
            rsViajes.MoveNext
        Loop
        Dim frmRep As New InfDetViajes
        frmRep.Show vbModal
    Else
        MsgBox "No hay viajes"
    End If
Else
    MsgBox "Existen campos sin completar"
End If
End Sub

Private Sub Form_Load()
Text1(0).Text = ""
Text1(1).Text = ""
Text1(2).Text = ""
Text1(3).Text = ""
FDesde.Mask = ""
FDesde.Text = ""
FDesde.Mask = "##/##/####"
FHasta.Mask = ""
FHasta.Text = ""
FHasta.Mask = "##/##/####"
End Sub

Private Sub Text1_LostFocus(Index As Integer)
Select Case Index
    Case 0:
        If Not Text1(0) = "" Then
            Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE CodEmpresas = " & Text1(0) & "")
            If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
                Text1(1) = rsEmpresas!DescEmpresas
            End If
        End If
    Case 2:
        If Not Text1(2) = "" Then
            Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & Text1(2) & "", 2)
            If Not rsFleteros.EOF And Not rsFleteros.BOF Then
                Text1(3) = rsFleteros!Descflet
            End If
        End If
End Select
End Sub
